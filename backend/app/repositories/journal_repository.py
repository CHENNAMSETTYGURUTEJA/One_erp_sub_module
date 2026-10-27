from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models.journal_entry import JournalEntry, JournalEntryLine
from ..models.account import Account
from ..schemas.journal_entry import JournalEntryCreate


class JournalRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, journal_entry_id: int) -> Optional[JournalEntry]:
        return self.db.query(JournalEntry).filter(JournalEntry.journal_entry_id == journal_entry_id).first()

    def list_entries(self, company_id: int, status: Optional[str] = None) -> List[JournalEntry]:
        query = self.db.query(JournalEntry).filter(JournalEntry.company_id == company_id)
        if status:
            query = query.filter(JournalEntry.status == status)
        return query.order_by(JournalEntry.journal_entry_id.desc()).all()

    def create(self, data: JournalEntryCreate, entry_number: str, created_by: str = "ADMIN") -> JournalEntry:
        total_debit = sum(line.debit for line in data.lines)
        total_credit = sum(line.credit for line in data.lines)

        entry = JournalEntry(
            company_id=data.company_id,
            period_id=data.period_id,
            entry_number=entry_number,
            entry_date=data.entry_date,
            description=data.description,
            reference=data.reference,
            total_debit=total_debit,
            total_credit=total_credit,
            status="DRAFT",
            created_by=created_by,
        )
        self.db.add(entry)
        self.db.flush()

        for line in data.lines:
            db_line = JournalEntryLine(
                journal_entry_id=entry.journal_entry_id,
                account_id=line.account_id,
                description=line.description or data.description,
                debit=line.debit,
                credit=line.credit,
            )
            self.db.add(db_line)

        self.db.commit()
        self.db.refresh(entry)
        return entry

    def post(self, entry: JournalEntry, posted_by: str = "ADMIN") -> JournalEntry:
        """
        Posts the journal entry to the General Ledger and updates account balances:
        - Asset / Expense: Increases with Debit, decreases with Credit
        - Liability / Equity / Revenue: Increases with Credit, decreases with Debit
        """
        for line in entry.lines:
            account = self.db.query(Account).filter(Account.account_id == line.account_id).first()
            if account:
                debit_val = float(line.debit or 0.0)
                credit_val = float(line.credit or 0.0)
                if account.account_type in ["Asset", "Expense"]:
                    account.current_balance = float(account.current_balance or 0.0) + debit_val - credit_val
                else:
                    account.current_balance = float(account.current_balance or 0.0) + credit_val - debit_val

        entry.status = "POSTED"
        entry.posted_at = datetime.now(timezone.utc)
        entry.posted_by = posted_by

        self.db.commit()
        self.db.refresh(entry)
        return entry

    def get_account_gl_lines(self, company_id: int, account_id: int) -> List[Dict[str, Any]]:
        """Retrieves all posted lines affecting an account for General Ledger view."""
        lines = (
            self.db.query(JournalEntryLine, JournalEntry)
            .join(JournalEntry, JournalEntryLine.journal_entry_id == JournalEntry.journal_entry_id)
            .filter(
                JournalEntry.company_id == company_id,
                JournalEntry.status == "POSTED",
                JournalEntryLine.account_id == account_id,
            )
            .order_by(JournalEntry.entry_date.asc(), JournalEntry.journal_entry_id.asc())
            .all()
        )

        results = []
        for line, entry in lines:
            results.append({
                "entry_number": entry.entry_number,
                "entry_date": entry.entry_date.isoformat(),
                "description": line.description,
                "debit": float(line.debit or 0.0),
                "credit": float(line.credit or 0.0),
            })
        return results

