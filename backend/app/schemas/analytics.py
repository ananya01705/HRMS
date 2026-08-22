import uuid
from datetime import datetime
from pydantic import BaseModel


class BurnoutRiskOut(BaseModel):
    user_id: uuid.UUID
    employee_name: str
    employee_code: str
    department: str
    risk_score: float  # 0 to 100
    risk_level: str    # Low, Medium, High, Critical
    overtime_hours_30d: float
    leave_days_taken_90d: float
    consecutive_days_worked: int
    recommendation: str


class AuditLogOut(BaseModel):
    id: uuid.UUID
    table_name: str
    record_id: str
    action: str
    changed_by: uuid.UUID | None = None
    actor_name: str | None = None
    changed_at: datetime
    old_data: dict | None = None
    new_data: dict | None = None

    class Config:
        from_attributes = True


class DashboardSummaryOut(BaseModel):
    total_employees: int
    active_today: int
    pending_leaves: int
    monthly_payroll_total: float
    department_counts: dict[str, int]
    attendance_rate: float
