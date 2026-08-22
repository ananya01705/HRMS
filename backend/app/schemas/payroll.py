import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.payroll import PayrollStatus


class GeneratePayrollRequest(BaseModel):
    user_id: uuid.UUID
    month: int
    year: int


class PayrollOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    employee_name: str | None = None
    employee_code: str | None = None
    department: str | None = None
    designation: str | None = None
    month: int
    year: int
    basic_salary: float
    hra: float
    allowances: float
    gross_salary: float
    tax_deduction: float
    pf_deduction: float
    unpaid_leave_deduction: float
    net_salary: float
    payable_days: int
    unpaid_days: int
    status: PayrollStatus
    processed_at: datetime

    class Config:
        from_attributes = True
