from typing import List, Optional
from sqlalchemy.orm import Session
from ..repositories.account_repository import AccountRepository
from ..models.account import Account
from ..models.financial_year import FiscalYear, FiscalPeriod
from ..schemas.account import AccountCreate
from ..schemas.financial_year import FiscalYearCreate
from ..utils.exceptions import DuplicateEntityException, EntityNotFoundException
from ..core.logging import logger


class AccountService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AccountRepository(db)

    def list_accounts(self, company_id: int) -> List[Account]:
        return self.repo.list_accounts(company_id)

    def get_account(self, account_id: int) -> Account:
        account = self.repo.get_account_by_id(account_id)
        if not account:
            raise EntityNotFoundException(f"Account with ID {account_id} not found.")
        return account

    def create_account(self, data: AccountCreate, created_by: str = "ADMIN") -> Account:

        existing = self.repo.get_account_by_code(data.company_id, data.account_code)
        if existing:
            raise DuplicateEntityException(
                f"Account code '{data.account_code}' already exists in this company."
            )
        return self.repo.create_account(data, created_by=created_by)


    def list_fiscal_years(self, company_id: int) -> List[FiscalYear]:
        return self.repo.list_fiscal_years(company_id)

    def create_fiscal_year(self, data: FiscalYearCreate) -> FiscalYear:
        return self.repo.create_fiscal_year_with_periods(data)

    def toggle_period_status(self, period_id: int, status: str) -> FiscalPeriod:
        period = self.repo.update_period_status(period_id, status)
        if not period:
            raise EntityNotFoundException(f"Fiscal period {period_id} not found.")
        logger.info(f"Fiscal period {period_id} status changed to {status}")
        return period

    def get_period_history(self, period_id: int):
        if not self.repo.get_period_by_id(period_id):
            raise EntityNotFoundException(f"Fiscal period {period_id} not found.")
        return self.repo.list_period_history(period_id)

