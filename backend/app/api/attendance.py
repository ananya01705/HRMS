from fastapi import APIRouter

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


@router.get("/")
async def list_attendance():
    """Owned by Person B. TODO: return records scoped by role (own vs all via RLS)."""
    return []


@router.post("/check-in")
async def check_in():
    """Owned by Person B. TODO: create attendance record; DB trigger will pg_notify automatically."""
    return {"message": "not implemented yet"}


@router.post("/check-out")
async def check_out():
    """Owned by Person B."""
    return {"message": "not implemented yet"}
