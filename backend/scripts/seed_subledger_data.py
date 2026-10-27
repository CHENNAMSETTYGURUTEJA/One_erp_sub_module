"""
Seed Subledger Demo Data for STACKLY OneERP Platform.
Populates realistic commercial data for:
  - Accounts Payable (AP) Supplier Invoices & Payments
  - Accounts Receivable (AR) Customer Invoices & Receipts
  - Fixed Assets Master with Accumulated Depreciation
  - Budget Plan vs Actual Allocations with Variance
  - GST Compliance Records (Inward & Outward, CGST, SGST, IGST)
"""
import os
import sys
from datetime import date, timedelta
from decimal import Decimal

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.db.database import SessionLocal
from app.models.company import Company
from app.models.account import Account
from app.models.financial_year import FiscalYear
from app.models.subledger import APInvoice, ARInvoice, FixedAsset, Budget, GSTRecord
from app.services.company_service import CompanyService
from app.services.account_service import AccountService
from app.schemas.financial_year import FiscalYearCreate


def seed_subledger_for_company(db, company: Company):
    cid = company.company_id
    code = company.company_code
    fiscal_start_year = date.today().year if date.today().month >= 4 else date.today().year - 1
    print(f"\n=======================================================")
    print(f"[*] Seeding Subledger Data for: [{code}] {company.company_name}")
    print(f"=======================================================")


    accounts = db.query(Account).filter(Account.company_id == cid).all()
    if not accounts:
        print("  - Seeding standard Chart of Accounts...")
        CompanyService(db)._seed_default_accounts(cid, "SEEDER")
        accounts = db.query(Account).filter(Account.company_id == cid).all()
    acc_map = {a.account_code: a.account_id for a in accounts}


    fys = db.query(FiscalYear).filter(FiscalYear.company_id == cid).all()
    if not fys:
        print(f"  - Creating Fiscal Year FY {fiscal_start_year}-{fiscal_start_year + 1}...")
        fy = AccountService(db).create_fiscal_year(
            FiscalYearCreate(
                company_id=cid,
                year_name=f"FY {fiscal_start_year}-{fiscal_start_year + 1}",
                start_date=date(fiscal_start_year, 4, 1),
                end_date=date(fiscal_start_year + 1, 3, 31),
            )
        )
        fys = [fy]
    target_fy_id = fys[0].fiscal_year_id


    existing_ap = db.query(APInvoice).filter(APInvoice.company_id == cid).count()
    if existing_ap == 0:
        ap_data = [
            {
                "vendor_name": "STACKLY Digital Infrastructure Pvt Ltd",
                "invoice_number": f"{code}-AP-2601",
                "invoice_date": date(fiscal_start_year, 4, 15),
                "due_date": date(fiscal_start_year, 5, 15),
                "total_amount": Decimal("92350.00"),
                "paid_amount": Decimal("92350.00"),
                "remaining_amount": Decimal("0.00"),
                "status": "PAID",
            },
            {
                "vendor_name": "STACKLY Systems and Devices Pvt Ltd",
                "invoice_number": f"{code}-AP-2602",
                "invoice_date": date(fiscal_start_year, 5, 10),
                "due_date": date(fiscal_start_year, 6, 10),
                "total_amount": Decimal("268400.00"),
                "paid_amount": Decimal("134200.00"),
                "remaining_amount": Decimal("134200.00"),
                "status": "PARTIAL",
            },
            {
                "vendor_name": "STACKLY Energy Services Pvt Ltd",
                "invoice_number": f"{code}-AP-2603",
                "invoice_date": date(fiscal_start_year, 6, 1),
                "due_date": date(fiscal_start_year, 7, 1),
                "total_amount": Decimal("58750.00"),
                "paid_amount": Decimal("0.00"),
                "remaining_amount": Decimal("58750.00"),
                "status": "UNPAID",
            },
            {
                "vendor_name": "STACKLY Logistics Partners",
                "invoice_number": f"{code}-AP-2604",
                "invoice_date": date(fiscal_start_year, 6, 20),
                "due_date": date(fiscal_start_year, 7, 20),
                "total_amount": Decimal("41900.00"),
                "paid_amount": Decimal("41900.00"),
                "remaining_amount": Decimal("0.00"),
                "status": "PAID",
            },
            {
                "vendor_name": "STACKLY Workspace Solutions",
                "invoice_number": f"{code}-AP-2605",
                "invoice_date": date(fiscal_start_year, 7, 5),
                "due_date": date(fiscal_start_year, 8, 5),
                "total_amount": Decimal("126500.00"),
                "paid_amount": Decimal("63250.00"),
                "remaining_amount": Decimal("63250.00"),
                "status": "PARTIAL",
            },
            {
                "vendor_name": "STACKLY Telecom Services",
                "invoice_number": f"{code}-AP-2606",
                "invoice_date": date(fiscal_start_year, 8, 12),
                "due_date": date(fiscal_start_year, 9, 12),
                "total_amount": Decimal("22400.00"),
                "paid_amount": Decimal("0.00"),
                "remaining_amount": Decimal("22400.00"),
                "status": "UNPAID",
            },
        ]
        for ap in ap_data:
            db.add(APInvoice(company_id=cid, **ap))
        print(f"  [+] Added {len(ap_data)} Accounts Payable (AP) supplier invoices.")
    else:
        print(f"  [*] AP already has {existing_ap} invoices.")


    existing_ar = db.query(ARInvoice).filter(ARInvoice.company_id == cid).count()
    if existing_ar == 0:
        ar_data = [
            {
                "customer_name": "Northstar Analytics Pvt Ltd",
                "invoice_number": f"{code}-AR-5001",
                "invoice_date": date(fiscal_start_year, 4, 18),
                "due_date": date(fiscal_start_year, 5, 18),
                "total_amount": Decimal("420000.00"),
                "received_amount": Decimal("420000.00"),
                "remaining_amount": Decimal("0.00"),
                "status": "PAID",
            },
            {
                "customer_name": "Bluepeak Retail Systems Pvt Ltd",
                "invoice_number": f"{code}-AR-5002",
                "invoice_date": date(fiscal_start_year, 5, 22),
                "due_date": date(fiscal_start_year, 6, 22),
                "total_amount": Decimal("525600.00"),
                "received_amount": Decimal("262800.00"),
                "remaining_amount": Decimal("262800.00"),
                "status": "PARTIAL",
            },
            {
                "customer_name": "Meridian Health Network",
                "invoice_number": f"{code}-AR-5003",
                "invoice_date": date(fiscal_start_year, 6, 14),
                "due_date": date(fiscal_start_year, 7, 14),
                "total_amount": Decimal("198750.00"),
                "received_amount": Decimal("0.00"),
                "remaining_amount": Decimal("198750.00"),
                "status": "UNPAID",
            },
            {
                "customer_name": "Vertex Mobility Group",
                "invoice_number": f"{code}-AR-5004",
                "invoice_date": date(fiscal_start_year, 7, 8),
                "due_date": date(fiscal_start_year, 8, 8),
                "total_amount": Decimal("735000.00"),
                "received_amount": Decimal("735000.00"),
                "remaining_amount": Decimal("0.00"),
                "status": "PAID",
            },
            {
                "customer_name": "Cedarline Manufacturing Co",
                "invoice_number": f"{code}-AR-5005",
                "invoice_date": date(fiscal_start_year, 7, 28),
                "due_date": date(fiscal_start_year, 8, 28),
                "total_amount": Decimal("186400.00"),
                "received_amount": Decimal("104000.00"),
                "remaining_amount": Decimal("82400.00"),
                "status": "PARTIAL",
            },
            {
                "customer_name": "Orbit Commerce Labs Pvt Ltd",
                "invoice_number": f"{code}-AR-5006",
                "invoice_date": date(fiscal_start_year, 8, 20),
                "due_date": date(fiscal_start_year, 9, 20),
                "total_amount": Decimal("342500.00"),
                "received_amount": Decimal("0.00"),
                "remaining_amount": Decimal("342500.00"),
                "status": "UNPAID",
            },
        ]
        for ar in ar_data:
            db.add(ARInvoice(company_id=cid, **ar))
        print(f"  [+] Added {len(ar_data)} Accounts Receivable (AR) customer invoices.")
    else:
        print(f"  [*] AR already has {existing_ar} invoices.")


    existing_fa = db.query(FixedAsset).filter(FixedAsset.company_id == cid).count()
    if existing_fa == 0:
        asset_data = [
            {
                "asset_code": f"FA-IT-{cid}01",
                "asset_name": "STACKLY Compute Platform Server",
                "category": "IT Infrastructure",
                "purchase_date": date(fiscal_start_year - 1, 6, 1),
                "purchase_cost": Decimal("485000.00"),
                "accumulated_depreciation": Decimal("97000.00"),
                "current_net_value": Decimal("388000.00"),
                "status": "ACTIVE",
            },
            {
                "asset_code": f"FA-IT-{cid}02",
                "asset_name": "STACKLY Engineering Workstation Fleet",
                "category": "IT Hardware",
                "purchase_date": date(fiscal_start_year - 1, 9, 15),
                "purchase_cost": Decimal("348000.00"),
                "accumulated_depreciation": Decimal("69600.00"),
                "current_net_value": Decimal("278400.00"),
                "status": "ACTIVE",
            },
            {
                "asset_code": f"FA-MAC-{cid}01",
                "asset_name": "STACKLY Facility Backup Generator",
                "category": "Machinery & Plant",
                "purchase_date": date(fiscal_start_year - 1, 4, 10),
                "purchase_cost": Decimal("610000.00"),
                "accumulated_depreciation": Decimal("61000.00"),
                "current_net_value": Decimal("549000.00"),
                "status": "ACTIVE",
            },
            {
                "asset_code": f"FA-VEH-{cid}01",
                "asset_name": "STACKLY Electric Operations Vehicle",
                "category": "Vehicles & Logistics",
                "purchase_date": date(fiscal_start_year - 1, 11, 20),
                "purchase_cost": Decimal("725000.00"),
                "accumulated_depreciation": Decimal("108750.00"),
                "current_net_value": Decimal("616250.00"),
                "status": "ACTIVE",
            },
            {
                "asset_code": f"FA-FUR-{cid}01",
                "asset_name": "STACKLY Office Furniture and Fixtures",
                "category": "Furniture & Fixtures",
                "purchase_date": date(fiscal_start_year - 1, 5, 25),
                "purchase_cost": Decimal("235000.00"),
                "accumulated_depreciation": Decimal("23500.00"),
                "current_net_value": Decimal("211500.00"),
                "status": "ACTIVE",
            },
            {
                "asset_code": f"FA-BLD-{cid}01",
                "asset_name": "STACKLY Office Climate Infrastructure",
                "category": "Facilities & Buildings",
                "purchase_date": date(fiscal_start_year - 1, 3, 1),
                "purchase_cost": Decimal("420000.00"),
                "accumulated_depreciation": Decimal("42000.00"),
                "current_net_value": Decimal("378000.00"),
                "status": "ACTIVE",
            },
        ]
        for fa in asset_data:
            db.add(FixedAsset(company_id=cid, **fa))
        print(f"  [+] Added {len(asset_data)} Fixed Assets.")
    else:
        print(f"  [*] Fixed Assets already has {existing_fa} items.")


    existing_b = db.query(Budget).filter(Budget.company_id == cid).count()
    if existing_b == 0:
        budget_specs = [
            ("5001", Decimal("1650000.00"), Decimal("1012500.00")),
            ("5002", Decimal("525000.00"), Decimal("349000.00")),
            ("5003", Decimal("148000.00"), Decimal("118500.00")),
            ("1500", Decimal("310000.00"), Decimal("294500.00")),
            ("4001", Decimal("3600000.00"), Decimal("2765000.00")),
            ("4002", Decimal("1280000.00"), Decimal("976500.00")),
        ]
        b_count = 0
        for code_acc, budgeted, actual in budget_specs:
            acc_id = acc_map.get(code_acc)
            if acc_id:
                db.add(
                    Budget(
                        company_id=cid,
                        fiscal_year_id=target_fy_id,
                        account_id=acc_id,
                        budgeted_amount=budgeted,
                        actual_amount=actual,
                    )
                )
                b_count += 1
        print(f"  [+] Added {b_count} Account Budget Allocations.")
    else:
        print(f"  [*] Budgets already has {existing_b} records.")


    existing_gst = db.query(GSTRecord).filter(GSTRecord.company_id == cid).count()
    if existing_gst == 0:
        gst_data = [
            {
                "transaction_ref": f"{code}-GST-INW-01",
                "hsn_sac": "998314",
                "taxable_value": Decimal("92350.00"),
                "cgst_amount": Decimal("8311.50"),
                "sgst_amount": Decimal("8311.50"),
                "igst_amount": Decimal("0.00"),
                "total_tax": Decimal("16623.00"),
            },
            {
                "transaction_ref": f"{code}-GST-INW-02",
                "hsn_sac": "847130",
                "taxable_value": Decimal("268400.00"),
                "cgst_amount": Decimal("0.00"),
                "sgst_amount": Decimal("0.00"),
                "igst_amount": Decimal("48312.00"),
                "total_tax": Decimal("48312.00"),
            },
            {
                "transaction_ref": f"{code}-GST-INW-03",
                "hsn_sac": "997212",
                "taxable_value": Decimal("72500.00"),
                "cgst_amount": Decimal("6525.00"),
                "sgst_amount": Decimal("6525.00"),
                "igst_amount": Decimal("0.00"),
                "total_tax": Decimal("13050.00"),
            },
            {
                "transaction_ref": f"{code}-GST-OUT-01",
                "hsn_sac": "998313",
                "taxable_value": Decimal("420000.00"),
                "cgst_amount": Decimal("37800.00"),
                "sgst_amount": Decimal("37800.00"),
                "igst_amount": Decimal("0.00"),
                "total_tax": Decimal("75600.00"),
            },
            {
                "transaction_ref": f"{code}-GST-OUT-02",
                "hsn_sac": "998313",
                "taxable_value": Decimal("525600.00"),
                "cgst_amount": Decimal("0.00"),
                "sgst_amount": Decimal("0.00"),
                "igst_amount": Decimal("94608.00"),
                "total_tax": Decimal("94608.00"),
            },
            {
                "transaction_ref": f"{code}-GST-OUT-03",
                "hsn_sac": "998729",
                "taxable_value": Decimal("186400.00"),
                "cgst_amount": Decimal("16776.00"),
                "sgst_amount": Decimal("16776.00"),
                "igst_amount": Decimal("0.00"),
                "total_tax": Decimal("33552.00"),
            },
        ]
        for g in gst_data:
            db.add(GSTRecord(company_id=cid, **g))
        print(f"  [+] Added {len(gst_data)} GST Compliance Records.")
    else:
        print(f"  [*] GST already has {existing_gst} records.")

    db.commit()


def main():
    db = SessionLocal()
    try:
        companies = db.query(Company).all()
        if not companies:
            print("No companies found in database!")
            return

        for company in companies:
            seed_subledger_for_company(db, company)

        print("\n=======================================================")
        print("[SUCCESS] All Subledger Demo Data Seeded Successfully!")
        print("=======================================================\n")
    finally:
        db.close()


if __name__ == "__main__":
    main()
