from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Date, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from ..db.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class JournalEntry(Base):
    """Journal Entry Header."""
    __tablename__ = "journal_entries"

    journal_entry_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False, index=True)
    period_id = Column(Integer, ForeignKey("fiscal_periods.period_id"), nullable=False, index=True)
    entry_number = Column(String(50), unique=True, index=True, nullable=False)
    entry_date = Column(Date, nullable=False)
    description = Column(Text, nullable=False)
    reference = Column(String(100), nullable=True)
    total_debit = Column(Numeric(15, 2), default=0.00, nullable=False)
    total_credit = Column(Numeric(15, 2), default=0.00, nullable=False)
    status = Column(String(20), default="DRAFT", nullable=False)


    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    created_by = Column(String(50), default="SYSTEM", nullable=False)
    posted_at = Column(DateTime(timezone=True), nullable=True)
    posted_by = Column(String(50), nullable=True)


    lines = relationship("JournalEntryLine", back_populates="journal_entry", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "journal_entry_id": self.journal_entry_id,
            "company_id": self.company_id,
            "period_id": self.period_id,
            "entry_number": self.entry_number,
            "entry_date": str(self.entry_date) if self.entry_date else None,
            "description": self.description,
            "reference": self.reference,
            "total_debit": float(self.total_debit or 0.0),
            "total_credit": float(self.total_credit or 0.0),
            "status": self.status,
            "created_at": str(self.created_at) if self.created_at else None,
            "posted_at": str(self.posted_at) if self.posted_at else None,
            "lines": [line.to_dict() for line in self.lines] if self.lines else [],
        }


class JournalEntryLine(Base):
    """Journal Entry Line Item representing an individual debit or credit leg."""
    __tablename__ = "journal_entry_lines"

    line_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    journal_entry_id = Column(Integer, ForeignKey("journal_entries.journal_entry_id"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.account_id"), nullable=False, index=True)
    description = Column(String(255), nullable=True)
    debit = Column(Numeric(15, 2), default=0.00, nullable=False)
    credit = Column(Numeric(15, 2), default=0.00, nullable=False)

    journal_entry = relationship("JournalEntry", back_populates="lines")
    account = relationship("Account")

    def to_dict(self):
        return {
            "line_id": self.line_id,
            "journal_entry_id": self.journal_entry_id,
            "account_id": self.account_id,
            "account_code": self.account.account_code if self.account else None,
            "account_name": self.account.account_name if self.account else None,
            "description": self.description,
            "debit": float(self.debit or 0.0),
            "credit": float(self.credit or 0.0),
        }

