from typing import List, Optional
from sqlalchemy.orm import Session
from ..models.account import Account
from ..models.financial_year import FiscalYear, FiscalPeriod, FiscalPeriodHistory
from ..schemas.account import AccountCreate, AccountUpdate
from ..schemas.financial_year import FiscalYearCreate


class AccountRepository:
    def __init__(self, db: Session):
        self.db = db


    def get_account_by_id(self, account_id: int) -> Optional[Account]:
        return self.db.query(Account).filter(Account.account_id == account_id).first()

    def get_account_by_code(self, company_id: int, account_code: str) -> Optional[Account]:
        return (
            self.db.query(Account)
            .filter(Account.company_id == company_id, Account.account_code == account_code.upper())
            .first()
        )

    def list_accounts(self, company_id: int) -> List[Account]:
        return (
            self.db.query(Account)
            .filter(Account.company_id == company_id)
            .order_by(Account.account_code.asc())
            .all()
        )

    def create_account(self, data: AccountCreate, created_by: str = "ADMIN") -> Account:
        account = Account(
            company_id=data.company_id,
            account_code=data.account_code,
            account_name=data.account_name,
            account_type=data.account_type,
            opening_balance=data.opening_balance or 0.0,
            current_balance=data.opening_balance or 0.0,
            created_by=created_by,
            updated_by=created_by,
        )
        self.db.add(account)
        self.db.commit()
        self.db.refresh(account)
        return account


    def get_fiscal_year(self, fiscal_year_id: int) -> Optional[FiscalYear]:
        return self.db.query(FiscalYear).filter(FiscalYear.fiscal_year_id == fiscal_year_id).first()

    def list_fiscal_years(self, company_id: int) -> List[FiscalYear]:
        return (
            self.db.query(FiscalYear)
            .filter(FiscalYear.company_id == company_id)
            .order_by(FiscalYear.start_date.desc())
            .all()
        )

    def create_fiscal_year_with_periods(self, data: FiscalYearCreate) -> FiscalYear:
        from datetime import timedelta
        from ..models.company import Company
        from ..utils.exceptions import BusinessRuleException, EntityNotFoundException

        if data.start_date > data.end_date:
            raise BusinessRuleException("Fiscal year start date must be on or before its end date.")
        company = self.db.query(Company).filter(Company.company_id == data.company_id).with_for_update().first()
        if not company:
            raise EntityNotFoundException("Selected company does not exist.")
        overlap = self.db.query(FiscalYear).filter(
            FiscalYear.company_id == data.company_id,
            FiscalYear.start_date <= data.end_date,
            FiscalYear.end_date >= data.start_date,
        ).first()
        if overlap:
            raise BusinessRuleException(f"Fiscal year dates overlap '{overlap.year_name}'.")

        fy = FiscalYear(
            company_id=data.company_id,
            year_name=data.year_name,
            start_date=data.start_date,
            end_date=data.end_date,
            is_active=True,
        )
        self.db.add(fy)
        self.db.flush()


        import calendar
        from datetime import date

        cursor = data.start_date
        idx = 1
        while cursor <= data.end_date:
            month_end = date(cursor.year, cursor.month, calendar.monthrange(cursor.year, cursor.month)[1])
            p_end = min(month_end, data.end_date)
            period_name = cursor.strftime("%B %Y")

            period = FiscalPeriod(
                fiscal_year_id=fy.fiscal_year_id,
                period_number=idx,
                period_name=period_name,
                start_date=cursor,
                end_date=p_end,
                status="OPEN",
            )
            self.db.add(period)
            cursor = p_end + timedelta(days=1)
            idx += 1

        try:
            self.db.commit()
            self.db.refresh(fy)
        except Exception:
            self.db.rollback()
            raise
        return fy

    def get_period_by_id(self, period_id: int) -> Optional[FiscalPeriod]:
        return self.db.query(FiscalPeriod).filter(FiscalPeriod.period_id == period_id).first()

    def update_period_status(self, period_id: int, status: str) -> Optional[FiscalPeriod]:
        period = self.db.query(FiscalPeriod).filter(FiscalPeriod.period_id == period_id).with_for_update().first()
        if period:
            if period.status == status:
                return period
            if period.status not in ("OPEN", "CLOSED") or status not in ("OPEN", "CLOSED"):
                from ..utils.exceptions import BusinessRuleException
                raise BusinessRuleException(f"Cannot change fiscal period from {period.status} to {status}.")
            self.db.add(FiscalPeriodHistory(
                period_id=period.period_id,
                previous_status=period.status,
                new_status=status,
                changed_by="ADMIN",
            ))
            period.status = status
            period.updated_by = "ADMIN"
            self.db.commit()
            self.db.refresh(period)
        return period

    def list_period_history(self, period_id: int):
        return (self.db.query(FiscalPeriodHistory)
                .filter(FiscalPeriodHistory.period_id == period_id)
                .order_by(FiscalPeriodHistory.changed_at.desc(), FiscalPeriodHistory.history_id.desc()).all())

