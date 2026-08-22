import uuid
from datetime import date
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class SignupRequest(BaseModel):
    employee_code: str
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.employee
    department: str = "Engineering"
    designation: str = "Software Engineer"
    basic_salary: float = 75000.0


class UserOut(BaseModel):
    id: uuid.UUID
    employee_code: str
    email: EmailStr
    full_name: str
    role: UserRole
    department: str
    designation: str
    phone: str | None = None
    address: str | None = None
    avatar_url: str | None = None
    joining_date: date
    basic_salary: float
    is_verified: bool

    class Config:
        from_attributes = True


class ProfileUpdateRequest(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    address: str | None = None
    avatar_url: str | None = None


class UserUpdateRequest(BaseModel):
    full_name: str | None = None
    role: UserRole | None = None
    department: str | None = None
    designation: str | None = None
    phone: str | None = None
    address: str | None = None
    basic_salary: float | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
