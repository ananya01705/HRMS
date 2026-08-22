import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_scoped_db, require_roles
from app.models.leave import LeaveRequest, LeaveBalance, LeaveStatus, LeaveType
from app.models.user import User, UserRole
from app.schemas.leave import (
    LeaveApplyRequest,
    LeaveReviewRequest,
    LeaveRequestOut,
    LeaveBalanceOut,
)

router = APIRouter(prefix="/api/leave", tags=["leave"])


async def get_or_create_balance(user_id: uuid.UUID, year: int, db: AsyncSession) -> LeaveBalance:
    result = await db.execute(
        select(LeaveBalance).where(
            and_(LeaveBalance.user_id == user_id, LeaveBalance.year == year)
        )
    )
    bal = result.scalar_one_or_none()
    if not bal:
        bal = LeaveBalance(
            user_id=user_id,
            year=year,
            paid_allocated=24.0,
            paid_used=0.0,
            sick_allocated=12.0,
            sick_used=0.0,
            unpaid_used=0.0,
        )
        db.add(bal)
        await db.commit()
        await db.refresh(bal)
    return bal


@router.get("/balances", response_model=LeaveBalanceOut)
async def get_my_balances(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_scoped_db),
):
    current_year = date.today().year
    bal = await get_or_create_balance(current_user.id, current_year, db)
    paid_alloc = bal.paid_allocated if bal.paid_allocated is not None else 24.0
    paid_u = bal.paid_used if bal.paid_used is not None else 0.0
    sick_alloc = bal.sick_allocated if bal.sick_allocated is not None else 12.0
    sick_u = bal.sick_used if bal.sick_used is not None else 0.0
    unpaid_u = bal.unpaid_used if bal.unpaid_used is not None else 0.0

    return LeaveBalanceOut(
        year=bal.year,
        paid_allocated=paid_alloc,
        paid_used=paid_u,
        paid_remaining=max(0.0, paid_alloc - paid_u),
        sick_allocated=sick_alloc,
        sick_used=sick_u,
        sick_remaining=max(0.0, sick_alloc - sick_u),
        unpaid_used=unpaid_u,
    )


@router.post("/apply", response_model=LeaveRequestOut)
async def apply_leave(
    payload: LeaveApplyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_scoped_db),
):
    if payload.end_date < payload.start_date:
        raise HTTPException(status_code=400, detail="End date cannot be earlier than start date")

    days = (payload.end_date - payload.start_date).days + 1
    leave_req = LeaveRequest(
        user_id=current_user.id,
        leave_type=payload.leave_type,
        start_date=payload.start_date,
        end_date=payload.end_date,
        days_count=float(days),
        reason=payload.reason,
        status=LeaveStatus.pending,
    )
    db.add(leave_req)
    await db.commit()
    await db.refresh(leave_req)

    out = LeaveRequestOut.model_validate(leave_req)
    out.employee_name = current_user.full_name
    out.employee_code = current_user.employee_code
    out.department = current_user.department
    return out


@router.get("/my-requests", response_model=list[LeaveRequestOut])
async def my_leave_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_scoped_db),
):
    result = await db.execute(
        select(LeaveRequest)
        .options(selectinload(LeaveRequest.reviewer))
        .where(LeaveRequest.user_id == current_user.id)
        .order_by(LeaveRequest.created_at.desc())
    )
    records = result.scalars().all()
    res = []
    for r in records:
        out = LeaveRequestOut.model_validate(r)
        out.employee_name = current_user.full_name
        out.employee_code = current_user.employee_code
        out.department = current_user.department
        if r.reviewer:
            out.reviewer_name = r.reviewer.full_name
        res.append(out)
    return res


@router.get("/all-requests", response_model=list[LeaveRequestOut])
async def all_leave_requests(
    db: AsyncSession = Depends(get_scoped_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_officer)),
):
    result = await db.execute(
        select(LeaveRequest)
        .options(selectinload(LeaveRequest.user), selectinload(LeaveRequest.reviewer))
        .order_by(LeaveRequest.created_at.desc())
    )
    records = result.scalars().all()
    res = []
    for r in records:
        out = LeaveRequestOut.model_validate(r)
        if r.user:
            out.employee_name = r.user.full_name
            out.employee_code = r.user.employee_code
            out.department = r.user.department
        if r.reviewer:
            out.reviewer_name = r.reviewer.full_name
        res.append(out)
    return res


@router.post("/{leave_id}/review", response_model=LeaveRequestOut)
async def review_leave(
    leave_id: uuid.UUID,
    payload: LeaveReviewRequest,
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_officer)),
    db: AsyncSession = Depends(get_scoped_db),
):
    result = await db.execute(
        select(LeaveRequest)
        .options(selectinload(LeaveRequest.user))
        .where(LeaveRequest.id == leave_id)
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")

    req.status = payload.status
    req.reviewed_by = current_user.id
    req.review_comments = payload.comments

    if payload.status == LeaveStatus.approved:
        bal = await get_or_create_balance(req.user_id, req.start_date.year, db)
        if req.leave_type == LeaveType.paid:
            bal.paid_used += req.days_count
        elif req.leave_type == LeaveType.sick:
            bal.sick_used += req.days_count
        elif req.leave_type == LeaveType.unpaid:
            bal.unpaid_used += req.days_count

    await db.commit()
    await db.refresh(req)

    out = LeaveRequestOut.model_validate(req)
    if req.user:
        out.employee_name = req.user.full_name
        out.employee_code = req.user.employee_code
        out.department = req.user.department
    out.reviewer_name = current_user.full_name
    return out
