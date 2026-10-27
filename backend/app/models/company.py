from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Date, DateTime
from ..db.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Company(Base):
    """Company Master Model representing an organizational legal entity."""
    __tablename__ = "companies"

    company_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_code = Column(String(20), unique=True, index=True, nullable=False)
    company_name = Column(String(150), nullable=False)
    country = Column(String(100), nullable=False)
    currency = Column(String(10), nullable=False)
    financial_year_start = Column(Date, nullable=False)
    company_address = Column(Text, nullable=False)


    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    created_by = Column(String(50), default="SYSTEM", nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
    updated_by = Column(String(50), default="SYSTEM", nullable=False)

    def to_dict(self):
        return {
            "company_id": self.company_id,
            "company_code": self.company_code,
            "company_name": self.company_name,
            "country": self.country,
            "currency": self.currency,
            "financial_year_start": str(self.financial_year_start) if self.financial_year_start else None,
            "company_address": self.company_address,
            "created_at": str(self.created_at) if self.created_at else None,
            "created_by": self.created_by,
            "updated_at": str(self.updated_at) if self.updated_at else None,
            "updated_by": self.updated_by,
        }

