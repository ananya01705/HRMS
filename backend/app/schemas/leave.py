import uuid
from datetime import datetime, date
from pydantic import BaseModel
from app.models.leave import LeaveType, LeaveStatus


class LeaveApplyRequest(BaseModel):
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: str


class LeaveReviewRequest(BaseModel):
    status: LeaveStatus  # approved or rejected
    comments: str | None = None


class LeaveRequestOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    employee_name: str | None = None
    employee_code: str | None = None
    department: str | None = None
    leave_type: LeaveType
    start_date: date
    end_date: date
    days_count: float
    reason: str
    status: LeaveStatus
    reviewed_by: uuid.UUID | None = None
    reviewer_name: str | None = None
    review_comments: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class LeaveBalanceOut(BaseModel):
    year: int
    paid_allocated: float
    paid_used: float
    paid_remaining: float
    sick_allocated: float
    sick_used: float
    sick_remaining: float
    unpaid_used: float
