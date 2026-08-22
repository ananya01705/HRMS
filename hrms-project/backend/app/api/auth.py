from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup")
async def signup(db: AsyncSession = Depends(get_db)):
    """Owned by Person A. TODO: validate input, hash password, create user, send verification email."""
    return {"message": "not implemented yet"}


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """Owned by Person A. TODO: verify credentials, return JWT access token."""
    return {"message": "not implemented yet"}
