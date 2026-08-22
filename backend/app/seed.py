import asyncio
from datetime import date, datetime, timedelta
from sqlalchemy import select, text
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import hash_password
from app.models import User, UserRole, Attendance, AttendanceStatus, LeaveRequest, LeaveStatus, LeaveType, LeaveBalance, Payroll, PayrollStatus

DEMO_USERS = [
    {
        "employee_code": "EMP-2026-001",
        "email": "admin@dayflow.com",
        "password": "admin123",
        "full_name": "Eleanor Vance (Admin)",
        "role": UserRole.admin,
        "department": "Executive Management",
        "designation": "Chief Operating Officer",
        "basic_salary": 150000.0,
    },
    {
        "employee_code": "EMP-2026-002",
        "email": "hr@dayflow.com",
        "password": "hr123",
        "full_name": "Marcus Sterling (HR Lead)",
        "role": UserRole.hr_officer,
        "department": "Human Resources",
        "designation": "HR Director",
        "basic_salary": 110000.0,
    },
    {
        "employee_code": "EMP-2026-003",
        "email": "alex@dayflow.com",
        "password": "emp123",
        "full_name": "Alex Mercer",
        "role": UserRole.employee,
        "department": "Engineering",
        "designation": "Senior Full-Stack Engineer",
        "basic_salary": 95000.0,
    },
    {
        "employee_code": "EMP-2026-004",
        "email": "sarah@dayflow.com",
        "password": "emp123",
        "full_name": "Sarah Connor",
        "role": UserRole.employee,
        "department": "Engineering",
        "designation": "DevOps Specialist",
        "basic_salary": 92000.0,
    },
    {
        "employee_code": "EMP-2026-005",
        "email": "david@dayflow.com",
        "password": "emp123",
        "full_name": "David Kim",
        "role": UserRole.employee,
        "department": "Product & Design",
        "designation": "Lead UI/UX Designer",
        "basic_salary": 88000.0,
    },
]


async def seed_data():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        print("Checking existing database users...")
        res = await db.execute(select(User))
        existing_users = {u.email: u for u in res.scalars().all()}
        
        for udata in DEMO_USERS:
            if udata["email"] in existing_users:
                # Update password to match updated credentials
                existing_users[udata["email"]].hashed_password = hash_password(udata["password"])
            else:
                user = User(
                    employee_code=udata["employee_code"],
                    email=udata["email"],
                    hashed_password=hash_password(udata["password"]),
                    full_name=udata["full_name"],
                    role=udata["role"],
                    department=udata["department"],
                    designation=udata["designation"],
                    basic_salary=udata["basic_salary"],
                    is_verified=True,
                )
                db.add(user)
        await db.commit()

        # Re-fetch users for IDs
        res = await db.execute(select(User))
        created_users = res.scalars().all()

        # Seed leave balances & past attendance/leave records for all users
        today = date.today()
        for user in created_users:
            # 1. Leave Balance
            bal_res = await db.execute(select(LeaveBalance).where(LeaveBalance.user_id == user.id))
            if not bal_res.scalars().first():
                bal = LeaveBalance(
                    user_id=user.id,
                    year=today.year,
                    paid_allocated=24.0,
                    paid_used=3.0 if user.role == UserRole.employee else 1.0,
                    sick_allocated=12.0,
                    sick_used=1.0,
                )
                db.add(bal)

            # 2. Past 14 days attendance history
            att_res = await db.execute(select(Attendance).where(Attendance.user_id == user.id))
            if not att_res.scalars().first():
                for day_offset in range(1, 15):
                    past_date = today - timedelta(days=day_offset)
                    if past_date.weekday() < 5:  # Weekday
                        check_in = datetime.combine(past_date, datetime.min.time()).replace(hour=9, minute=0)
                        check_out = datetime.combine(past_date, datetime.min.time()).replace(hour=17, minute=30)
                        att = Attendance(
                            user_id=user.id,
                            date=past_date,
                            check_in=check_in,
                            check_out=check_out,
                            work_hours=8.5,
                            status=AttendanceStatus.present,
                            notes="Automated biometric sync",
                        )
                        db.add(att)

            # 3. Sample Leave Requests
            lr_res = await db.execute(select(LeaveRequest).where(LeaveRequest.user_id == user.id))
            if not lr_res.scalars().first():
                if user.role == UserRole.employee:
                    l_req = LeaveRequest(
                        user_id=user.id,
                        leave_type=LeaveType.paid,
                        start_date=today + timedelta(days=5),
                        end_date=today + timedelta(days=7),
                        days_count=3.0,
                        reason="Annual family vacation",
                        status=LeaveStatus.pending,
                    )
                    db.add(l_req)

            # 4. Sample Payroll
            pay_res = await db.execute(select(Payroll).where(Payroll.user_id == user.id))
            if not pay_res.scalars().first():
                basic = user.basic_salary or 85000.0
                hra = round(basic * 0.40, 2)
                allowances = round(basic * 0.15, 2)
                gross = basic + hra + allowances
                pf = round(basic * 0.12, 2)
                tax = round(gross * 0.10, 2)
                net = round(gross - pf - tax, 2)

                payroll = Payroll(
                    user_id=user.id,
                    month=today.month,
                    year=today.year,
                    basic_salary=basic,
                    hra=hra,
                    allowances=allowances,
                    gross_salary=gross,
                    tax_deduction=tax,
                    pf_deduction=pf,
                    unpaid_leave_deduction=0.0,
                    net_salary=net,
                    payable_days=30,
                    unpaid_days=0,
                    status=PayrollStatus.processed,
                )
                db.add(payroll)

        await db.commit()
        print("Database successfully seeded with demo users, attendance history, leaves, and payroll records!")


if __name__ == "__main__":
    asyncio.run(seed_data())
