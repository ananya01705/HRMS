import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PayrollStatus(str, enum.Enum):
    draft = "draft"
    processed = "processed"
    paid = "paid"


class Payroll(Base):
    __tablename__ = "payroll"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    basic_salary: Mapped[float] = mapped_column(Float, default=0.0)
    hra: Mapped[float] = mapped_column(Float, default=0.0)
    allowances: Mapped[float] = mapped_column(Float, default=0.0)
    gross_salary: Mapped[float] = mapped_column(Float, default=0.0)
    tax_deduction: Mapped[float] = mapped_column(Float, default=0.0)
    pf_deduction: Mapped[float] = mapped_column(Float, default=0.0)
    unpaid_leave_deduction: Mapped[float] = mapped_column(Float, default=0.0)
    net_salary: Mapped[float] = mapped_column(Float, default=0.0)
    payable_days: Mapped[int] = mapped_column(Integer, default=30)
    unpaid_days: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[PayrollStatus] = mapped_column(Enum(PayrollStatus), default=PayrollStatus.processed)
    processed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", backref="payrolls")
