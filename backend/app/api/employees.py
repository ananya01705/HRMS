import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles, get_db
from app.models.user import User, UserRole
from app.schemas.auth import UserOut, UserUpdateRequest

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("/", response_model=list[UserOut])
async def list_employees(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_officer)),
):
    result = await db.execute(select(User).order_by(User.full_name))
    users = result.scalars().all()
    return users


@router.get("/{employee_id}", response_model=UserOut)
async def get_employee(
    employee_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.employee and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Not authorized to view other employee details")

    result = await db.execute(select(User).where(User.id == employee_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    return user


@router.put("/{employee_id}", response_model=UserOut)
async def update_employee(
    employee_id: uuid.UUID,
    payload: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.hr_officer)),
):
    result = await db.execute(select(User).where(User.id == employee_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.role is not None and current_user.role == UserRole.admin:
        user.role = payload.role
    if payload.department is not None:
        user.department = payload.department
    if payload.designation is not None:
        user.designation = payload.designation
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.address is not None:
        user.address = payload.address
    if payload.basic_salary is not None and current_user.role == UserRole.admin:
        user.basic_salary = payload.basic_salary

    await db.commit()
    await db.refresh(user)
    return user
