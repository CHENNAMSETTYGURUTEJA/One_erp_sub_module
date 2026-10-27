from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..repositories.journal_repository import JournalRepository
from ..repositories.account_repository import AccountRepository
from ..models.journal_entry import JournalEntry
from ..schemas.journal_entry import JournalEntryCreate
from ..utils.exceptions import (
    EntityNotFoundException, PeriodClosedException, UnbalancedJournalException, BusinessRuleException
)
from ..core.logging import logger


class JournalService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = JournalRepository(db)
        self.account_repo = AccountRepository(db)

    def list_entries(self, company_id: int, status: Optional[str] = None) -> List[JournalEntry]:
        return self.repo.list_entries(company_id, status)

    def get_entry(self, journal_entry_id: int) -> JournalEntry:
        entry = self.repo.get_by_id(journal_entry_id)
        if not entry:
            raise EntityNotFoundException(f"Journal Entry with ID {journal_entry_id} not found.")
        return entry

    def create_journal_entry(self, data: JournalEntryCreate, created_by: str = "ADMIN") -> JournalEntry:

        period = self.account_repo.get_period_by_id(data.period_id)
        if not period:
            raise EntityNotFoundException(f"Financial period {data.period_id} does not exist.")
        if period.status != "OPEN":
            raise PeriodClosedException(f"Cannot create entry in closed period '{period.period_name}'.")
        if not period.start_date <= data.entry_date <= period.end_date:
            raise BusinessRuleException(
                f"Entry date {data.entry_date} falls outside period '{period.period_name}' "
                f"({period.start_date} to {period.end_date})."
            )
        if period.fiscal_year.company_id != data.company_id:
            raise BusinessRuleException("Selected fiscal period does not belong to this company.")


        total_debit = sum(float(l.debit) for l in data.lines)
        total_credit = sum(float(l.credit) for l in data.lines)
        if abs(total_debit - total_credit) > 0.001:
            raise UnbalancedJournalException(total_debit, total_credit)


        count = self.db.query(JournalEntry).filter(JournalEntry.company_id == data.company_id).count()
        entry_number = f"JV-{data.entry_date.year}-{count + 1:04d}"

        entry = self.repo.create(data, entry_number=entry_number, created_by=created_by)
        logger.info(f"Journal Entry created: {entry.entry_number} (Status: DRAFT)")
        return entry

    def post_journal_entry(self, journal_entry_id: int, posted_by: str = "ADMIN") -> JournalEntry:
        entry = self.get_entry(journal_entry_id)

        if entry.status == "POSTED":
            raise BusinessRuleException(f"Journal Entry {entry.entry_number} is already posted.")


        period = self.account_repo.get_period_by_id(entry.period_id)
        if not period or period.status != "OPEN":
            raise PeriodClosedException("Posting rejected: The financial period is closed.")
        if not period.start_date <= entry.entry_date <= period.end_date:
            raise BusinessRuleException("Posting rejected: Entry date is outside the selected fiscal period.")
        if period.fiscal_year.company_id != entry.company_id:
            raise BusinessRuleException("Posting rejected: Fiscal period belongs to another company.")

        posted_entry = self.repo.post(entry, posted_by=posted_by)
        logger.info(f"Journal Entry posted to General Ledger: {posted_entry.entry_number}")
        return posted_entry

    def get_account_gl(self, company_id: int, account_id: int) -> Dict[str, Any]:
        """Returns the General Ledger account statement."""
        account = self.account_repo.get_account_by_id(account_id)
        if not account or account.company_id != company_id:
            raise EntityNotFoundException("Account not found.")

        lines = self.repo.get_account_gl_lines(company_id, account_id)
        return {
            "account_id": account.account_id,
            "account_code": account.account_code,
            "account_name": account.account_name,
            "account_type": account.account_type,
            "opening_balance": float(account.opening_balance),
            "current_balance": float(account.current_balance),
            "transactions": lines,
        }

