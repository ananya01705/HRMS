import uuid
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_, extract
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_scoped_db, require_roles
from app.models.payroll import Payroll, PayrollStatus
from app.models.leave import LeaveRequest, LeaveStatus, LeaveType
from app.models.user import User, UserRole
from app.schemas.payroll import GeneratePayrollRequest, PayrollOut

router = APIRouter(prefix="/api/payroll", tags=["payroll"])


@router.get("/me", response_model=list[PayrollOut])
async def my_payroll(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_scoped_db),
):
    result = await db.execute(
        select(Payroll)
        .where(Payroll.user_id == current_user.id)
        .order_by(Payroll.year.desc(), Payroll.month.desc())
    )
    records = result.scalars().all()
    res = []
    for r in records:
        out = PayrollOut.model_validate(r)
        out.employee_name = current_user.full_name
        out.employee_code = current_user.employee_code
        out.department = current_user.department
        out.designation = current_user.designation
        res.append(out)
    return res


@router.get("/all", response_model=list[PayrollOut])
async def all_payroll(
    db: AsyncSession = Depends(get_scoped_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_officer)),
):
    result = await db.execute(
        select(Payroll)
        .options(selectinload(Payroll.user))
        .order_by(Payroll.year.desc(), Payroll.month.desc())
    )
    records = result.scalars().all()
    res = []
    for r in records:
        out = PayrollOut.model_validate(r)
        if r.user:
            out.employee_name = r.user.full_name
            out.employee_code = r.user.employee_code
            out.department = r.user.department
            out.designation = r.user.designation
        res.append(out)
    return res


@router.post("/generate", response_model=PayrollOut)
async def generate_payroll(
    payload: GeneratePayrollRequest,
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_officer)),
    db: AsyncSession = Depends(get_scoped_db),
):
    # Fetch target user
    u_res = await db.execute(select(User).where(User.id == payload.user_id))
    target_user = u_res.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Check if payroll already exists for month/year
    p_res = await db.execute(
        select(Payroll).where(
            and_(
                Payroll.user_id == payload.user_id,
                Payroll.month == payload.month,
                Payroll.year == payload.year,
            )
        )
    )
    existing_payroll = p_res.scalar_one_or_none()

    # Calculate unpaid leaves in that month
    leaves_res = await db.execute(
        select(LeaveRequest).where(
            and_(
                LeaveRequest.user_id == payload.user_id,
                LeaveRequest.status == LeaveStatus.approved,
                LeaveRequest.leave_type == LeaveType.unpaid,
                extract("month", LeaveRequest.start_date) == payload.month,
                extract("year", LeaveRequest.start_date) == payload.year,
            )
        )
    )
    unpaid_leaves = leaves_res.scalars().all()
    unpaid_days = sum(l.days_count for l in unpaid_leaves)

    basic = target_user.basic_salary
    hra = round(basic * 0.40, 2)
    allowances = round(basic * 0.15, 2)
    gross = basic + hra + allowances

    daily_rate = gross / 30.0
    unpaid_deduction = round(daily_rate * unpaid_days, 2)
    pf_deduction = round(basic * 0.12, 2)
    tax_deduction = round(gross * 0.10, 2)

    net = round(gross - pf_deduction - tax_deduction - unpaid_deduction, 2)
    payable = max(0, 30 - int(unpaid_days))

    if existing_payroll:
        payroll_obj = existing_payroll
        payroll_obj.basic_salary = basic
        payroll_obj.hra = hra
        payroll_obj.allowances = allowances
        payroll_obj.gross_salary = gross
        payroll_obj.tax_deduction = tax_deduction
        payroll_obj.pf_deduction = pf_deduction
        payroll_obj.unpaid_leave_deduction = unpaid_deduction
        payroll_obj.net_salary = net
        payroll_obj.payable_days = payable
        payroll_obj.unpaid_days = int(unpaid_days)
        payroll_obj.status = PayrollStatus.processed
        payroll_obj.processed_at = datetime.utcnow()
    else:
        payroll_obj = Payroll(
            user_id=payload.user_id,
            month=payload.month,
            year=payload.year,
            basic_salary=basic,
            hra=hra,
            allowances=allowances,
            gross_salary=gross,
            tax_deduction=tax_deduction,
            pf_deduction=pf_deduction,
            unpaid_leave_deduction=unpaid_deduction,
            net_salary=net,
            payable_days=payable,
            unpaid_days=int(unpaid_days),
            status=PayrollStatus.processed,
        )
        db.add(payroll_obj)

    await db.commit()
    await db.refresh(payroll_obj)

    out = PayrollOut.model_validate(payroll_obj)
    out.employee_name = target_user.full_name
    out.employee_code = target_user.employee_code
    out.department = target_user.department
    out.designation = target_user.designation
    return out
