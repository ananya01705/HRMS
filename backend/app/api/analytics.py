from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles, get_db
from app.models.user import User, UserRole
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveRequest, LeaveStatus
from app.models.payroll import Payroll
from app.models.audit import AuditLog
from app.schemas.analytics import BurnoutRiskOut, AuditLogOut, DashboardSummaryOut

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/dashboard-summary", response_model=DashboardSummaryOut)
async def dashboard_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Total employees
    emp_res = await db.execute(select(func.count(User.id)))
    total_employees = emp_res.scalar() or 0

    # Active today
    today = date.today()
    att_res = await db.execute(
        select(func.count(Attendance.id)).where(
            and_(Attendance.date == today, Attendance.status != AttendanceStatus.absent)
        )
    )
    active_today = att_res.scalar() or 0

    # Pending leaves
    leave_res = await db.execute(
        select(func.count(LeaveRequest.id)).where(LeaveRequest.status == LeaveStatus.pending)
    )
    pending_leaves = leave_res.scalar() or 0

    # Monthly payroll total
    payroll_res = await db.execute(select(func.sum(Payroll.net_salary)))
    monthly_payroll_total = payroll_res.scalar() or 0.0

    # Department counts
    dept_res = await db.execute(select(User.department, func.count(User.id)).group_by(User.department))
    department_counts = {dept: count for dept, count in dept_res.all()}

    attendance_rate = round((active_today / total_employees * 100.0), 1) if total_employees > 0 else 0.0

    return DashboardSummaryOut(
        total_employees=total_employees,
        active_today=active_today,
        pending_leaves=pending_leaves,
        monthly_payroll_total=round(monthly_payroll_total, 2),
        department_counts=department_counts,
        attendance_rate=attendance_rate,
    )


@router.get("/burnout-risk", response_model=list[BurnoutRiskOut])
async def burnout_risk_index(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_officer)),
):
    emp_res = await db.execute(select(User).order_by(User.full_name))
    employees = emp_res.scalars().all()

    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    ninety_days_ago = now - timedelta(days=90)

    risks = []
    for emp in employees:
        # Calculate work hours in past 30 days
        att_res = await db.execute(
            select(func.sum(Attendance.work_hours)).where(
                and_(
                    Attendance.user_id == emp.id,
                    Attendance.check_in >= thirty_days_ago,
                )
            )
        )
        total_hours = att_res.scalar() or 0.0
        # Overtime = hours above 160 hours / month
        overtime_hours = max(0.0, total_hours - 160.0)

        # Calculate leave days taken in past 90 days
        leave_res = await db.execute(
            select(func.sum(LeaveRequest.days_count)).where(
                and_(
                    LeaveRequest.user_id == emp.id,
                    LeaveRequest.status == LeaveStatus.approved,
                    LeaveRequest.start_date >= ninety_days_ago.date(),
                )
            )
        )
        leave_taken = leave_res.scalar() or 0.0

        # Calculate consecutive working days
        att_cnt_res = await db.execute(
            select(func.count(Attendance.id)).where(
                and_(
                    Attendance.user_id == emp.id,
                    Attendance.check_in >= (now - timedelta(days=14)),
                )
            )
        )
        consecutive_days = att_cnt_res.scalar() or 0

        # Compute risk score (0-100)
        # Higher overtime, low leave taken, high consecutive days -> high score
        score = (overtime_hours * 1.5) + (max(0, 10 - leave_taken) * 3) + (consecutive_days * 2.5)
        score = min(100.0, round(score, 1))

        if score >= 75.0:
            level = "Critical"
            rec = "Mandatory 3-day time-off recommended. Overtime limit exceeded."
        elif score >= 50.0:
            level = "High"
            rec = "High overtime detected. Encourage taking accumulated leave."
        elif score >= 25.0:
            level = "Medium"
            rec = "Balanced workload. Monitor weekend overtime hours."
        else:
            level = "Low"
            rec = "Optimal work-life balance."

        risks.append(
            BurnoutRiskOut(
                user_id=emp.id,
                employee_name=emp.full_name,
                employee_code=emp.employee_code,
                department=emp.department,
                risk_score=score,
                risk_level=level,
                overtime_hours_30d=round(overtime_hours, 1),
                leave_days_taken_90d=round(leave_taken, 1),
                consecutive_days_worked=consecutive_days,
                recommendation=rec,
            )
        )

    return sorted(risks, key=lambda x: x.risk_score, reverse=True)


@router.get("/audit-logs", response_model=list[AuditLogOut])
async def audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_officer)),
):
    result = await db.execute(select(AuditLog).order_by(AuditLog.changed_at.desc()).limit(100))
    logs = result.scalars().all()
    res = []
    for l in logs:
        out = AuditLogOut.model_validate(l)
        if l.changed_by:
            u_res = await db.execute(select(User.full_name).where(User.id == l.changed_by))
            out.actor_name = u_res.scalar_one_or_none() or "System User"
        else:
            out.actor_name = "System Trigger"
        res.append(out)
    return res
