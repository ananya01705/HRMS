import uuid

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class SignupRequest(BaseModel):
    employee_code: str
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.employee


class UserOut(BaseModel):
    id: uuid.UUID
    employee_code: str
    email: EmailStr
    full_name: str
    role: UserRole
    is_verified: bool

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
