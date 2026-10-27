from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, Numeric, ForeignKey, DateTime
from ..db.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Account(Base):
    """
    General Ledger Account within the Chart of Accounts (COA).
    Account Types: Asset, Liability, Equity, Revenue, Expense.
    """
    __tablename__ = "accounts"

    account_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False, index=True)
    account_code = Column(String(20), nullable=False, index=True)
    account_name = Column(String(100), nullable=False)
    account_type = Column(String(20), nullable=False)
    opening_balance = Column(Numeric(15, 2), default=0.00, nullable=False)
    current_balance = Column(Numeric(15, 2), default=0.00, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    created_by = Column(String(50), default="SYSTEM", nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
    updated_by = Column(String(50), default="SYSTEM", nullable=False)

    def to_dict(self):
        return {
            "account_id": self.account_id,
            "company_id": self.company_id,
            "account_code": self.account_code,
            "account_name": self.account_name,
            "account_type": self.account_type,
            "opening_balance": float(self.opening_balance or 0.0),
            "current_balance": float(self.current_balance or 0.0),
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

