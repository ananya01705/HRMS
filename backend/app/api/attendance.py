from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_scoped_db, require_roles
from app.models.attendance import Attendance, AttendanceStatus
from app.models.user import User, UserRole
from app.schemas.attendance import CheckInRequest, CheckOutRequest, AttendanceOut, TodayStatusOut

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


@router.get("/today-status", response_model=TodayStatusOut)
async def today_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_scoped_db),
):
    today = date.today()
    result = await db.execute(
        select(Attendance).where(
            and_(Attendance.user_id == current_user.id, Attendance.date == today)
        )
    )
    record = result.scalar_one_or_none()

    if not record:
        return TodayStatusOut(is_checked_in=False, today_status="not_checked_in")

    if record.check_out is not None:
        elapsed = int((record.check_out - record.check_in).total_seconds())
        return TodayStatusOut(
            is_checked_in=False,
            check_in_time=record.check_in,
            work_seconds=elapsed,
            today_status="completed",
        )

    now = datetime.utcnow()
    elapsed = int((now - record.check_in).total_seconds())
    return TodayStatusOut(
        is_checked_in=True,
        check_in_time=record.check_in,
        work_seconds=elapsed,
        today_status="checked_in",
    )


@router.post("/check-in", response_model=AttendanceOut)
async def check_in(
    payload: CheckInRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_scoped_db),
):
    today = date.today()
    existing = await db.execute(
        select(Attendance).where(
            and_(Attendance.user_id == current_user.id, Attendance.date == today)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already checked in today")

    now = datetime.utcnow()
    attendance = Attendance(
        user_id=current_user.id,
        date=today,
        check_in=now,
        status=AttendanceStatus.present,
        notes=payload.notes,
    )
    db.add(attendance)
    await db.commit()
    await db.refresh(attendance)

    out = AttendanceOut.model_validate(attendance)
    out.employee_name = current_user.full_name
    out.employee_code = current_user.employee_code
    out.department = current_user.department
    return out


@router.post("/check-out", response_model=AttendanceOut)
async def check_out(
    payload: CheckOutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_scoped_db),
):
    today = date.today()
    result = await db.execute(
        select(Attendance).where(
            and_(
                Attendance.user_id == current_user.id,
                Attendance.date == today,
                Attendance.check_out.is_(None),
            )
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=400, detail="No active check-in record found for today")

    now = datetime.utcnow()
    record.check_out = now
    diff_hours = (now - record.check_in).total_seconds() / 3600.0
    record.work_hours = round(diff_hours, 2)
    if record.work_hours < 4.0:
        record.status = AttendanceStatus.half_day
    else:
        record.status = AttendanceStatus.present

    if payload.notes:
        record.notes = (record.notes or "") + f" | Out note: {payload.notes}"

    await db.commit()
    await db.refresh(record)

    out = AttendanceOut.model_validate(record)
    out.employee_name = current_user.full_name
    out.employee_code = current_user.employee_code
    out.department = current_user.department
    return out


@router.get("/my-records", response_model=list[AttendanceOut])
async def my_attendance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_scoped_db),
):
    result = await db.execute(
        select(Attendance)
        .where(Attendance.user_id == current_user.id)
        .order_by(Attendance.date.desc())
    )
    records = result.scalars().all()
    res = []
    for r in records:
        out = AttendanceOut.model_validate(r)
        out.employee_name = current_user.full_name
        out.employee_code = current_user.employee_code
        out.department = current_user.department
        res.append(out)
    return res


@router.get("/all-records", response_model=list[AttendanceOut])
async def all_attendance(
    db: AsyncSession = Depends(get_scoped_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_officer)),
):
    result = await db.execute(
        select(Attendance)
        .options(selectinload(Attendance.user))
        .order_by(Attendance.date.desc())
    )
    records = result.scalars().all()
    res = []
    for r in records:
        out = AttendanceOut.model_validate(r)
        if r.user:
            out.employee_name = r.user.full_name
            out.employee_code = r.user.employee_code
            out.department = r.user.department
        res.append(out)
    return res
