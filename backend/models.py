import os
import sys
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Date, DateTime

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

try:
    from .database import Base
except ImportError:
    from database import Base


def utc_now():
    """Return current UTC datetime with timezone awareness."""
    return datetime.now(timezone.utc)


class Company(Base):
    """
    Company model representing the organization/legal entity in the ERP system.
    Stores foundational company details required before any financial transactions occur.
    """
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)


    company_name = Column(String(150), nullable=False)
    company_code = Column(String(20), unique=True, index=True, nullable=False)
    country = Column(String(100), nullable=False)
    currency = Column(String(10), nullable=False)
    financial_year_start = Column(Date, nullable=False)
    company_address = Column(Text, nullable=False)


    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    def __repr__(self) -> str:
        return f"<Company(id={self.id}, code='{self.company_code}', name='{self.company_name}')>"
