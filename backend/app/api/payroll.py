from fastapi import APIRouter

router = APIRouter(prefix="/api/payroll", tags=["payroll"])


@router.get("/me")
async def my_payroll():
    """Owned by Person C. Read-only payroll for the logged-in employee."""
    return {}


@router.get("/analytics/burnout-score")
async def burnout_score():
    """Owned by Person C. TODO: compute via SQL window functions over overtime + leave patterns."""
    return []


@router.get("/{employee_id}/payslip")
async def generate_payslip(employee_id: str):
    """Owned by Person C. TODO: generate PDF payslip server-side."""
    return {"message": "not implemented yet"}
