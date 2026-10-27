from datetime import date
from decimal import Decimal

import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.models import account, company, financial_year, journal_entry, subledger, user
from app.models.company import Company
from app.repositories.account_repository import AccountRepository
from app.repositories.subledger_repository import SubledgerRepository
from app.schemas.financial_year import FiscalYearCreate
from app.schemas.subledger import ARInvoiceCreate
from app.services.subledger_service import SubledgerService
from app.utils.exceptions import BusinessRuleException


class FicoIntegrityTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.db = sessionmaker(bind=self.engine)()
        self.db.add(Company(
            company_code="TEST01", company_name="Test Company", country="India",
            currency="INR", financial_year_start=date(2026, 4, 1), company_address="Test",
        ))
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def test_fiscal_periods_follow_configured_fiscal_year_boundaries(self):
        year = AccountRepository(self.db).create_fiscal_year_with_periods(FiscalYearCreate(
            company_id=1, year_name="FY Apr 2026 - Mar 2027",
            start_date=date(2026, 4, 1), end_date=date(2027, 3, 31),
        ))
        periods = sorted(year.periods, key=lambda p: p.period_number)
        self.assertEqual(len(periods), 12)
        self.assertEqual((periods[0].start_date, periods[0].end_date), (date(2026, 4, 1), date(2026, 4, 30)))
        self.assertEqual((periods[-1].start_date, periods[-1].end_date), (date(2027, 3, 1), date(2027, 3, 31)))

    def test_overlapping_fiscal_years_are_rejected(self):
        repo = AccountRepository(self.db)
        payload = FiscalYearCreate(company_id=1, year_name="FY 2026-2027",
            start_date=date(2026, 4, 1), end_date=date(2027, 3, 31))
        repo.create_fiscal_year_with_periods(payload)
        with self.assertRaisesRegex(BusinessRuleException, "overlap"):
            repo.create_fiscal_year_with_periods(payload)

    def test_period_status_changes_are_audited(self):
        repo = AccountRepository(self.db)
        year = repo.create_fiscal_year_with_periods(FiscalYearCreate(company_id=1,
            year_name="FY 2026-2027", start_date=date(2026, 4, 1), end_date=date(2027, 3, 31)))
        period = year.periods[0]
        repo.update_period_status(period.period_id, "CLOSED")
        history = repo.list_period_history(period.period_id)
        self.assertEqual(len(history), 1)
        self.assertEqual((history[0].previous_status, history[0].new_status), ("OPEN", "CLOSED"))

    def test_ar_invoice_rejects_due_date_before_invoice_date(self):
        with self.assertRaisesRegex(ValueError, "Due date"):
            ARInvoiceCreate(company_id=1, customer_name="Customer One", invoice_number="INV-1",
                invoice_date=date(2026, 5, 2), due_date=date(2026, 5, 1), total_amount=Decimal("100.00"))

    def test_ar_receipt_cannot_overpay_and_ageing_uses_due_date(self):
        repo = SubledgerRepository(self.db)
        invoice = repo.create_ar_invoice(ARInvoiceCreate(company_id=1, customer_name="Customer One",
            invoice_number="INV-1", invoice_date=date(2026, 5, 1), due_date=date(2026, 5, 20),
            total_amount=Decimal("100.00")))
        with self.assertRaisesRegex(BusinessRuleException, "exceeds"):
            repo.record_ar_payment(invoice.ar_invoice_id, Decimal("100.01"), "RCPT-OVER", date(2026, 6, 1))
        repo.record_ar_payment(invoice.ar_invoice_id, Decimal("40.00"), "RCPT-1", date(2026, 6, 1))
        repo.record_ar_payment(invoice.ar_invoice_id, Decimal("40.00"), "RCPT-1", date(2026, 6, 1))
        report = SubledgerService(self.db).get_ar_ageing(1, date(2026, 6, 10))
        self.assertEqual(report["buckets"]["days_1_30"], 60.0)
        self.assertEqual(report["total_outstanding"], 60.0)
        self.assertEqual(invoice.status, "PARTIAL")


if __name__ == "__main__":
    unittest.main()
