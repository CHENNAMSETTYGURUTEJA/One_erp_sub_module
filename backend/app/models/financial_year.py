from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from ..db.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class FiscalYear(Base):
    """Fiscal Year Model (e.g. 2026-2027)."""
    __tablename__ = "fiscal_years"

    fiscal_year_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False, index=True)
    year_name = Column(String(50), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    created_by = Column(String(50), default="SYSTEM", nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
    updated_by = Column(String(50), default="SYSTEM", nullable=False)


    periods = relationship("FiscalPeriod", back_populates="fiscal_year", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "fiscal_year_id": self.fiscal_year_id,
            "company_id": self.company_id,
            "year_name": self.year_name,
            "start_date": str(self.start_date) if self.start_date else None,
            "end_date": str(self.end_date) if self.end_date else None,
            "is_active": self.is_active,
            "periods": [p.to_dict() for p in self.periods] if self.periods else [],
        }


class FiscalPeriod(Base):
    """Fiscal Period Model (e.g. April 2026). Can be OPEN or CLOSED."""
    __tablename__ = "fiscal_periods"

    period_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fiscal_year_id = Column(Integer, ForeignKey("fiscal_years.fiscal_year_id"), nullable=False, index=True)
    period_number = Column(Integer, nullable=False)
    period_name = Column(String(50), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(20), default="OPEN", nullable=False)


    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    created_by = Column(String(50), default="SYSTEM", nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
    updated_by = Column(String(50), default="SYSTEM", nullable=False)

    fiscal_year = relationship("FiscalYear", back_populates="periods")

    def to_dict(self):
        return {
            "period_id": self.period_id,
            "fiscal_year_id": self.fiscal_year_id,
            "period_number": self.period_number,
            "period_name": self.period_name,
            "start_date": str(self.start_date) if self.start_date else None,
            "end_date": str(self.end_date) if self.end_date else None,
            "status": self.status,
            "created_at": str(self.created_at) if self.created_at else None,
            "updated_at": str(self.updated_at) if self.updated_at else None,
            "updated_by": self.updated_by,
        }


class FiscalPeriodHistory(Base):
    """Append-only audit entries for fiscal period status transitions."""
    __tablename__ = "fiscal_period_history"

    history_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    period_id = Column(Integer, ForeignKey("fiscal_periods.period_id"), nullable=False, index=True)
    previous_status = Column(String(20), nullable=False)
    new_status = Column(String(20), nullable=False)
    changed_by = Column(String(50), nullable=False, default="SYSTEM")
    changed_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    def to_dict(self):
        return {
            "history_id": self.history_id,
            "period_id": self.period_id,
            "previous_status": self.previous_status,
            "new_status": self.new_status,
            "changed_by": self.changed_by,
            "changed_at": str(self.changed_at),
        }

