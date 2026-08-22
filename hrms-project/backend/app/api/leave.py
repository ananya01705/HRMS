from fastapi import APIRouter

router = APIRouter(prefix="/api/leave", tags=["leave"])


@router.get("/")
async def list_leave_requests():
    """Owned by Person B."""
    return []


@router.post("/apply")
async def apply_leave():
    """Owned by Person B. TODO: create leave request with status=pending."""
    return {"message": "not implemented yet"}


@router.post("/{leave_id}/approve")
async def approve_leave(leave_id: str):
    """Owned by Person B. Admin/HR only."""
    return {"message": "not implemented yet"}


@router.post("/{leave_id}/reject")
async def reject_leave(leave_id: str):
    """Owned by Person B. Admin/HR only."""
    return {"message": "not implemented yet"}
