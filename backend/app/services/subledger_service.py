from decimal import Decimal
from datetime import date
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from ..repositories.subledger_repository import SubledgerRepository
from ..models.subledger import APInvoice, ARInvoice, FixedAsset, Budget, GSTRecord
from ..schemas.subledger import (
    APInvoiceCreate, ARInvoiceCreate, FixedAssetCreate, BudgetCreate, GSTRecordCreate
)
from ..utils.exceptions import EntityNotFoundException, BusinessRuleException


class SubledgerService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = SubledgerRepository(db)


    def list_ap(self, company_id: int) -> List[APInvoice]:
        return self.repo.list_ap_invoices(company_id)

    def create_ap(self, data: APInvoiceCreate) -> APInvoice:
        return self.repo.create_ap_invoice(data)

    def record_ap_payment(self, ap_invoice_id: int, amount: Decimal) -> APInvoice:
        invoice = self.repo.record_ap_payment(ap_invoice_id, amount)
        if not invoice:
            raise EntityNotFoundException("AP Invoice not found.")
        return invoice


    def list_ar(self, company_id: int) -> List[ARInvoice]:
        return self.repo.list_ar_invoices(company_id)

    def list_ar_receipts(self, company_id: int):
        return self.repo.list_ar_receipts(company_id)

    def create_ar(self, data: ARInvoiceCreate) -> ARInvoice:
        return self.repo.create_ar_invoice(data)

    def record_ar_payment(self, ar_invoice_id: int, amount: Decimal, receipt_reference: str, receipt_date: date) -> ARInvoice:
        invoice = self.repo.record_ar_payment(ar_invoice_id, amount, receipt_reference, receipt_date)
        if not invoice:
            raise EntityNotFoundException("AR Invoice not found.")
        return invoice

    def get_ar_ageing(self, company_id: int, as_of: date) -> Dict[str, Any]:
        invoices = self.repo.list_ar_invoices(company_id)
        buckets = {"not_yet_due": Decimal("0.00"), "days_1_30": Decimal("0.00"),
                   "days_31_60": Decimal("0.00"), "days_61_90": Decimal("0.00"),
                   "over_90_days": Decimal("0.00")}
        customers: Dict[str, Dict[str, Any]] = {}
        for invoice in invoices:
            balance = Decimal(invoice.remaining_amount or 0).quantize(Decimal("0.01"))
            if balance <= 0:
                continue
            overdue_days = (as_of - invoice.due_date).days
            bucket = ("not_yet_due" if overdue_days <= 0 else "days_1_30" if overdue_days <= 30
                      else "days_31_60" if overdue_days <= 60 else "days_61_90" if overdue_days <= 90
                      else "over_90_days")
            buckets[bucket] += balance
            customer = customers.setdefault(invoice.customer_name, {"customer_name": invoice.customer_name,
                "outstanding": Decimal("0.00"), "invoice_count": 0})
            customer["outstanding"] += balance
            customer["invoice_count"] += 1
        return {"company_id": company_id, "as_of": as_of.isoformat(),
                "buckets": {key: float(value) for key, value in buckets.items()},
                "total_outstanding": float(sum(buckets.values())),
                "customers": [{**row, "outstanding": float(row["outstanding"])} for row in customers.values()]}


    def list_assets(self, company_id: int) -> List[FixedAsset]:
        return self.repo.list_assets(company_id)

    def create_asset(self, data: FixedAssetCreate) -> FixedAsset:
        return self.repo.create_asset(data)

    def record_depreciation(self, asset_id: int, amount: Decimal) -> FixedAsset:
        asset = self.repo.record_depreciation(asset_id, amount)
        if not asset:
            raise EntityNotFoundException("Fixed Asset not found.")
        return asset


    def list_budgets(self, company_id: int, fiscal_year_id: Optional[int] = None) -> List[Budget]:
        return self.repo.list_budgets(company_id, fiscal_year_id)

    def set_budget(self, data: BudgetCreate) -> Budget:
        return self.repo.create_or_update_budget(data)


    def list_gst(self, company_id: int) -> List[GSTRecord]:
        return self.repo.list_gst_records(company_id)

    def record_gst(self, data: GSTRecordCreate) -> GSTRecord:
        return self.repo.create_gst_record(data)


    def seed_sample_subledger_data(self, company_id: int) -> Dict[str, int]:
        """Seeds realistic demo data for AP, AR, Fixed Assets, Budgets, and GST for a company."""
        from datetime import date
        from ..models.account import Account
        from ..models.financial_year import FiscalYear
        from ..models.company import Company

        fiscal_start_year = date.today().year if date.today().month >= 4 else date.today().year - 1

        company = self.db.query(Company).filter(Company.company_id == company_id).first()
        if not company:
            raise EntityNotFoundException(f"Company {company_id} not found.")

        code = company.company_code
        cid = company.company_id


        accounts = self.db.query(Account).filter(Account.company_id == cid).all()
        acc_map = {a.account_code: a.account_id for a in accounts}

        fys = self.db.query(FiscalYear).filter(FiscalYear.company_id == cid).all()
        target_fy_id = fys[0].fiscal_year_id if fys else None

        counts = {"ap": 0, "ar": 0, "assets": 0, "budgets": 0, "gst": 0}


        if self.db.query(APInvoice).filter(APInvoice.company_id == cid).count() == 0:
            ap_list = [
                APInvoice(
                    company_id=cid,
                    vendor_name="STACKLY Digital Infrastructure Pvt Ltd",
                    invoice_number=f"{code}-AP-2601",
                    invoice_date=date(fiscal_start_year, 4, 15),
                    due_date=date(fiscal_start_year, 5, 15),
                    total_amount=Decimal("92350.00"),
                    paid_amount=Decimal("92350.00"),
                    remaining_amount=Decimal("0.00"),
                    status="PAID",
                ),
                APInvoice(
                    company_id=cid,
                    vendor_name="STACKLY Systems and Devices Pvt Ltd",
                    invoice_number=f"{code}-AP-2602",
                    invoice_date=date(fiscal_start_year, 5, 10),
                    due_date=date(fiscal_start_year, 6, 10),
                    total_amount=Decimal("268400.00"),
                    paid_amount=Decimal("134200.00"),
                    remaining_amount=Decimal("134200.00"),
                    status="PARTIAL",
                ),
                APInvoice(
                    company_id=cid,
                    vendor_name="STACKLY Energy Services Pvt Ltd",
                    invoice_number=f"{code}-AP-2603",
                    invoice_date=date(fiscal_start_year, 6, 1),
                    due_date=date(fiscal_start_year, 7, 1),
                    total_amount=Decimal("58750.00"),
                    paid_amount=Decimal("0.00"),
                    remaining_amount=Decimal("58750.00"),
                    status="UNPAID",
                ),
                APInvoice(
                    company_id=cid,
                    vendor_name="STACKLY Logistics Partners",
                    invoice_number=f"{code}-AP-2604",
                    invoice_date=date(fiscal_start_year, 6, 20),
                    due_date=date(fiscal_start_year, 7, 20),
                    total_amount=Decimal("41900.00"),
                    paid_amount=Decimal("41900.00"),
                    remaining_amount=Decimal("0.00"),
                    status="PAID",
                ),
                APInvoice(
                    company_id=cid,
                    vendor_name="STACKLY Workspace Solutions",
                    invoice_number=f"{code}-AP-2605",
                    invoice_date=date(fiscal_start_year, 7, 5),
                    due_date=date(fiscal_start_year, 8, 5),
                    total_amount=Decimal("126500.00"),
                    paid_amount=Decimal("63250.00"),
                    remaining_amount=Decimal("63250.00"),
                    status="PARTIAL",
                ),
                APInvoice(
                    company_id=cid,
                    vendor_name="STACKLY Telecom Services",
                    invoice_number=f"{code}-AP-2606",
                    invoice_date=date(fiscal_start_year, 8, 12),
                    due_date=date(fiscal_start_year, 9, 12),
                    total_amount=Decimal("22400.00"),
                    paid_amount=Decimal("0.00"),
                    remaining_amount=Decimal("22400.00"),
                    status="UNPAID",
                ),
            ]
            for ap in ap_list:
                self.db.add(ap)
            counts["ap"] = len(ap_list)


        if self.db.query(ARInvoice).filter(ARInvoice.company_id == cid).count() == 0:
            ar_list = [
                ARInvoice(
                    company_id=cid,
                    customer_name="STACKLY Consulting Services Pvt Ltd",
                    invoice_number=f"{code}-AR-5001",
                    invoice_date=date(fiscal_start_year, 4, 18),
                    due_date=date(fiscal_start_year, 5, 18),
                    total_amount=Decimal("420000.00"),
                    received_amount=Decimal("420000.00"),
                    remaining_amount=Decimal("0.00"),
                    status="PAID",
                ),
                ARInvoice(
                    company_id=cid,
                    customer_name="STACKLY Enterprise Solutions Pvt Ltd",
                    invoice_number=f"{code}-AR-5002",
                    invoice_date=date(fiscal_start_year, 5, 22),
                    due_date=date(fiscal_start_year, 6, 22),
                    total_amount=Decimal("525600.00"),
                    received_amount=Decimal("262800.00"),
                    remaining_amount=Decimal("262800.00"),
                    status="PARTIAL",
                ),
                ARInvoice(
                    company_id=cid,
                    customer_name="STACKLY Financial Services Pvt Ltd",
                    invoice_number=f"{code}-AR-5003",
                    invoice_date=date(fiscal_start_year, 6, 14),
                    due_date=date(fiscal_start_year, 7, 14),
                    total_amount=Decimal("198750.00"),
                    received_amount=Decimal("0.00"),
                    remaining_amount=Decimal("198750.00"),
                    status="UNPAID",
                ),
                ARInvoice(
                    company_id=cid,
                    customer_name="STACKLY Mobility Systems Pvt Ltd",
                    invoice_number=f"{code}-AR-5004",
                    invoice_date=date(fiscal_start_year, 7, 8),
                    due_date=date(fiscal_start_year, 8, 8),
                    total_amount=Decimal("735000.00"),
                    received_amount=Decimal("735000.00"),
                    remaining_amount=Decimal("0.00"),
                    status="PAID",
                ),
                ARInvoice(
                    company_id=cid,
                    customer_name="STACKLY Cloud Solutions Pvt Ltd",
                    invoice_number=f"{code}-AR-5005",
                    invoice_date=date(fiscal_start_year, 7, 28),
                    due_date=date(fiscal_start_year, 8, 28),
                    total_amount=Decimal("186400.00"),
                    received_amount=Decimal("104000.00"),
                    remaining_amount=Decimal("82400.00"),
                    status="PARTIAL",
                ),
                ARInvoice(
                    company_id=cid,
                    customer_name="STACKLY Health Services Pvt Ltd",
                    invoice_number=f"{code}-AR-5006",
                    invoice_date=date(fiscal_start_year, 8, 20),
                    due_date=date(fiscal_start_year, 9, 20),
                    total_amount=Decimal("342500.00"),
                    received_amount=Decimal("0.00"),
                    remaining_amount=Decimal("342500.00"),
                    status="UNPAID",
                ),
            ]
            for ar in ar_list:
                self.db.add(ar)
            counts["ar"] = len(ar_list)


        if self.db.query(FixedAsset).filter(FixedAsset.company_id == cid).count() == 0:
            asset_list = [
                FixedAsset(
                    company_id=cid,
                    asset_code=f"FA-IT-{cid}01",
                    asset_name="STACKLY Compute Platform Server",
                    category="IT Infrastructure",
                    purchase_date=date(fiscal_start_year - 1, 6, 1),
                    purchase_cost=Decimal("485000.00"),
                    accumulated_depreciation=Decimal("97000.00"),
                    current_net_value=Decimal("388000.00"),
                    status="ACTIVE",
                ),
                FixedAsset(
                    company_id=cid,
                    asset_code=f"FA-IT-{cid}02",
                    asset_name="STACKLY Engineering Workstation Fleet",
                    category="IT Hardware",
                    purchase_date=date(fiscal_start_year - 1, 9, 15),
                    purchase_cost=Decimal("348000.00"),
                    accumulated_depreciation=Decimal("69600.00"),
                    current_net_value=Decimal("278400.00"),
                    status="ACTIVE",
                ),
                FixedAsset(
                    company_id=cid,
                    asset_code=f"FA-MAC-{cid}01",
                    asset_name="STACKLY Facility Backup Generator",
                    category="Machinery & Plant",
                    purchase_date=date(fiscal_start_year - 1, 4, 10),
                    purchase_cost=Decimal("610000.00"),
                    accumulated_depreciation=Decimal("61000.00"),
                    current_net_value=Decimal("549000.00"),
                    status="ACTIVE",
                ),
                FixedAsset(
                    company_id=cid,
                    asset_code=f"FA-VEH-{cid}01",
                    asset_name="STACKLY Electric Operations Vehicle",
                    category="Vehicles & Logistics",
                    purchase_date=date(fiscal_start_year - 1, 11, 20),
                    purchase_cost=Decimal("725000.00"),
                    accumulated_depreciation=Decimal("108750.00"),
                    current_net_value=Decimal("616250.00"),
                    status="ACTIVE",
                ),
                FixedAsset(
                    company_id=cid,
                    asset_code=f"FA-FUR-{cid}01",
                    asset_name="STACKLY Office Furniture and Fixtures",
                    category="Furniture & Fixtures",
                    purchase_date=date(fiscal_start_year - 1, 5, 25),
                    purchase_cost=Decimal("235000.00"),
                    accumulated_depreciation=Decimal("23500.00"),
                    current_net_value=Decimal("211500.00"),
                    status="ACTIVE",
                ),
                FixedAsset(
                    company_id=cid,
                    asset_code=f"FA-BLD-{cid}01",
                    asset_name="STACKLY Office Climate Infrastructure",
                    category="Facilities & Buildings",
                    purchase_date=date(fiscal_start_year - 1, 3, 1),
                    purchase_cost=Decimal("420000.00"),
                    accumulated_depreciation=Decimal("42000.00"),
                    current_net_value=Decimal("378000.00"),
                    status="ACTIVE",
                ),
            ]
            for fa in asset_list:
                self.db.add(fa)
            counts["assets"] = len(asset_list)


        if target_fy_id and self.db.query(Budget).filter(Budget.company_id == cid).count() == 0:
            budget_specs = [
                ("5001", Decimal("1650000.00"), Decimal("1012500.00")),
                ("5002", Decimal("525000.00"), Decimal("349000.00")),
                ("5003", Decimal("148000.00"), Decimal("118500.00")),
                ("1500", Decimal("310000.00"), Decimal("294500.00")),
                ("4001", Decimal("3600000.00"), Decimal("2765000.00")),
                ("4002", Decimal("1280000.00"), Decimal("976500.00")),
            ]
            b_list = []
            for code_acc, budgeted, actual in budget_specs:
                acc_id = acc_map.get(code_acc)
                if acc_id:
                    b_list.append(
                        Budget(
                            company_id=cid,
                            fiscal_year_id=target_fy_id,
                            account_id=acc_id,
                            budgeted_amount=budgeted,
                            actual_amount=actual,
                        )
                    )
            for b in b_list:
                self.db.add(b)
            counts["budgets"] = len(b_list)


        if self.db.query(GSTRecord).filter(GSTRecord.company_id == cid).count() == 0:
            gst_list = [
                GSTRecord(
                    company_id=cid,
                    transaction_ref=f"{code}-GST-INW-01",
                    hsn_sac="998314",
                    taxable_value=Decimal("92350.00"),
                    cgst_amount=Decimal("8311.50"),
                    sgst_amount=Decimal("8311.50"),
                    igst_amount=Decimal("0.00"),
                    total_tax=Decimal("16623.00"),
                ),
                GSTRecord(
                    company_id=cid,
                    transaction_ref=f"{code}-GST-INW-02",
                    hsn_sac="847130",
                    taxable_value=Decimal("268400.00"),
                    cgst_amount=Decimal("0.00"),
                    sgst_amount=Decimal("0.00"),
                    igst_amount=Decimal("48312.00"),
                    total_tax=Decimal("48312.00"),
                ),
                GSTRecord(
                    company_id=cid,
                    transaction_ref=f"{code}-GST-INW-03",
                    hsn_sac="997212",
                    taxable_value=Decimal("72500.00"),
                    cgst_amount=Decimal("6525.00"),
                    sgst_amount=Decimal("6525.00"),
                    igst_amount=Decimal("0.00"),
                    total_tax=Decimal("13050.00"),
                ),
                GSTRecord(
                    company_id=cid,
                    transaction_ref=f"{code}-GST-OUT-01",
                    hsn_sac="998313",
                    taxable_value=Decimal("420000.00"),
                    cgst_amount=Decimal("37800.00"),
                    sgst_amount=Decimal("37800.00"),
                    igst_amount=Decimal("0.00"),
                    total_tax=Decimal("75600.00"),
                ),
                GSTRecord(
                    company_id=cid,
                    transaction_ref=f"{code}-GST-OUT-02",
                    hsn_sac="998313",
                    taxable_value=Decimal("525600.00"),
                    cgst_amount=Decimal("0.00"),
                    sgst_amount=Decimal("0.00"),
                    igst_amount=Decimal("94608.00"),
                    total_tax=Decimal("94608.00"),
                ),
                GSTRecord(
                    company_id=cid,
                    transaction_ref=f"{code}-GST-OUT-03",
                    hsn_sac="998729",
                    taxable_value=Decimal("186400.00"),
                    cgst_amount=Decimal("16776.00"),
                    sgst_amount=Decimal("16776.00"),
                    igst_amount=Decimal("0.00"),
                    total_tax=Decimal("33552.00"),
                ),
            ]
            for g in gst_list:
                self.db.add(g)
            counts["gst"] = len(gst_list)

        self.db.commit()
        return counts
