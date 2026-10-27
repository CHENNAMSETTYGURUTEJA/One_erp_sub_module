from typing import List, Optional
from sqlalchemy.orm import Session
from ..repositories.company_repository import CompanyRepository
from ..repositories.account_repository import AccountRepository
from ..schemas.company import CompanyCreate, CompanyUpdate
from ..schemas.account import AccountCreate
from ..models.company import Company
from ..utils.exceptions import DuplicateEntityException, EntityNotFoundException
from ..core.logging import logger


class CompanyService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CompanyRepository(db)
        self.account_repo = AccountRepository(db)

    def get_company(self, company_id: int) -> Company:
        company = self.repo.get_by_id(company_id)
        if not company:
            raise EntityNotFoundException(f"Company with ID {company_id} was not found.")
        return company

    def list_companies(self, skip: int = 0, limit: int = 100) -> List[Company]:
        return self.repo.list_all(skip=skip, limit=limit)

    def create_company(self, data: CompanyCreate, created_by: str = "ADMIN") -> Company:
        logger.info(f"Company creation started: Code={data.company_code}, Name='{data.company_name}'")


        existing = self.repo.get_by_code(data.company_code)
        if existing:
            logger.warning(f"Duplicate company code attempted: {data.company_code}")
            raise DuplicateEntityException(
                f"Company code '{data.company_code}' is already registered with company '{existing.company_name}'."
            )

        company = self.repo.create(data, created_by=created_by)
        logger.info(f"Company created successfully: ID={company.company_id}, Code={company.company_code}")


        self._seed_default_accounts(company.company_id, created_by)

        return company

    def update_company(self, company_id: int, data: CompanyUpdate, updated_by: str = "ADMIN") -> Company:
        company = self.repo.update(company_id, data, updated_by=updated_by)
        if not company:
            raise EntityNotFoundException(f"Company with ID {company_id} was not found.")
        return company

    def delete_company(self, company_id: int) -> bool:
        success = self.repo.delete(company_id)
        if not success:
            raise EntityNotFoundException(f"Company with ID {company_id} was not found.")
        return True

    def _seed_default_accounts(self, company_id: int, created_by: str):
        """Seeds foundational Chart of Accounts as described in the FICO Story."""
        default_accounts = [
            ("1001", "Cash in Hand", "Asset", 68500.0),
            ("1002", "STACKLY Bank Operating Account", "Asset", 312750.0),
            ("1100", "Accounts Receivable (Trade Debtors)", "Asset", 0.0),
            ("1500", "Office Equipment & Furniture", "Asset", 148000.0),
            ("2001", "Accounts Payable (Trade Creditors)", "Liability", 0.0),
            ("2002", "GST Payable", "Liability", 0.0),
            ("3001", "Shareholder Equity / Capital", "Equity", 529250.0),
            ("4001", "Sales Revenue", "Revenue", 0.0),
            ("4002", "Consulting & Service Revenue", "Revenue", 0.0),
            ("5001", "Salary & Wages Expense", "Expense", 0.0),
            ("5002", "Office Rent Expense", "Expense", 0.0),
            ("5003", "Electricity & Utilities Expense", "Expense", 0.0),
        ]
        for code, name, acc_type, op_bal in default_accounts:
            self.account_repo.create_account(
                AccountCreate(
                    company_id=company_id,
                    account_code=code,
                    account_name=name,
                    account_type=acc_type,
                    opening_balance=op_bal,
                ),
                created_by=created_by,
            )

