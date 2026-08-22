import uuid
from datetime import datetime, date
from pydantic import BaseModel
from app.models.attendance import AttendanceStatus


class CheckInRequest(BaseModel):
    notes: str | None = None


class CheckOutRequest(BaseModel):
    notes: str | None = None


class AttendanceOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    employee_name: str | None = None
    employee_code: str | None = None
    department: str | None = None
    date: date
    check_in: datetime
    check_out: datetime | None = None
    work_hours: float
    status: AttendanceStatus
    notes: str | None = None

    class Config:
        from_attributes = True


class TodayStatusOut(BaseModel):
    is_checked_in: bool
    check_in_time: datetime | None = None
    work_seconds: int = 0
    today_status: str = "not_checked_in"
