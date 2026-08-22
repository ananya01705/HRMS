import enum
import uuid
from datetime import datetime, date

from sqlalchemy import Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class LeaveType(str, enum.Enum):
    paid = "paid"
    sick = "sick"
    unpaid = "unpaid"


class LeaveStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    leave_type: Mapped[LeaveType] = mapped_column(Enum(LeaveType), default=LeaveType.paid)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    days_count: Mapped[float] = mapped_column(Float, default=1.0)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[LeaveStatus] = mapped_column(Enum(LeaveStatus), default=LeaveStatus.pending, index=True)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    review_comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id], backref="leave_requests")
    reviewer = relationship("User", foreign_keys=[reviewed_by])


class LeaveBalance(Base):
    __tablename__ = "leave_balances"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    year: Mapped[int] = mapped_column(Integer, default=2026)
    paid_allocated: Mapped[float] = mapped_column(Float, default=24.0)
    paid_used: Mapped[float] = mapped_column(Float, default=0.0)
    sick_allocated: Mapped[float] = mapped_column(Float, default=12.0)
    sick_used: Mapped[float] = mapped_column(Float, default=0.0)
    unpaid_used: Mapped[float] = mapped_column(Float, default=0.0)

    user = relationship("User", backref="leave_balances")
