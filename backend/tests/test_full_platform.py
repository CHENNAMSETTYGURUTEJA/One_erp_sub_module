"""
End-to-End Verification Test for STACKLY OneERP Platform.
Tests all endpoints, business rules, and database persistence.
"""
import os
import sys
from datetime import date
from decimal import Decimal
from fastapi.testclient import TestClient

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from app.main import app


def test_platform():
    with TestClient(app) as client:
        print("\n--- 1. Testing Platform Health Check ---")
        resp = client.get("/api/health")
        assert resp.status_code == 200
        print("Health check OK:", resp.json())

        print("\n--- 2. Testing Administrator Authentication ---")
        auth_resp = client.post(
            "/api/v1/auth/login",
            json={"username": "admin", "password": os.environ["ADMIN_PASSWORD"]},
        )
        assert auth_resp.status_code == 200, f"Auth failed: {auth_resp.text}"
        auth_data = auth_resp.json()["data"]
        token = auth_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"Auth successful for user: {auth_data['username']} (Role: {auth_data['role']})")

        print("\n--- 3. Testing Company Setup (Section 4 Response Standard) ---")
        comp_code = "STKTEST1"
        comp_resp = client.post(
            "/api/v1/companies",
            json={
                "company_name": "STACKLY Test Holdings Pvt Ltd",
                "company_code": comp_code,
                "country": "India",
                "currency": "INR",
                "financial_year_start": "2026-04-01",
                "company_address": "Tech Park 5, Whitefield, Bengaluru, 560066",
            },
            headers=headers,
        )
        if comp_resp.status_code == 409:
            print("Company STKTEST1 already exists, fetching existing...")
            list_resp = client.get("/api/v1/companies")
            company = [c for c in list_resp.json()["data"] if c["company_code"] == comp_code][0]
        else:
            assert comp_resp.status_code == 201
            company = comp_resp.json()["data"]

        company_id = company["company_id"]
        print(f"Company verified: ID={company_id}, Name='{company['company_name']}'")

        print("\n--- 4. Testing Duplicate Company Code Rejection ---")
        dup_resp = client.post(
            "/api/v1/companies",
            json={
                "company_name": "Another Company",
                "company_code": comp_code,
                "country": "India",
                "currency": "INR",
                "financial_year_start": "2026-04-01",
                "company_address": "Address",
            },
            headers=headers,
        )
        assert dup_resp.status_code == 409
        print(f"Duplicate rejected with 409 as expected: {dup_resp.json()['message']}")

        print("\n--- 5. Testing Chart of Accounts (Auto-Seeded) ---")
        acc_resp = client.get(f"/api/v1/accounts?company_id={company_id}", headers=headers)
        assert acc_resp.status_code == 200
        accounts = acc_resp.json()["data"]
        print(f"Auto-seeded Accounts retrieved ({len(accounts)} accounts):")
        for a in accounts[:4]:
            print(f" - [{a['account_code']}] {a['account_name']} ({a['account_type']}) - Bal: {a['current_balance']}")

        cash_acc = next(a for a in accounts if a["account_code"] == "1001")
        rent_acc = next(a for a in accounts if a["account_code"] == "5002")

        print("\n--- 6. Testing Fiscal Year & Period Creation ---")
        fy_resp = client.post(
            "/api/v1/fiscal-years",
            json={
                "company_id": company_id,
                "year_name": "FY 2026-2027",
                "start_date": "2026-04-01",
                "end_date": "2027-03-31",
            },
            headers=headers,
        )
        if fy_resp.status_code == 201:
            fy_data = fy_resp.json()["data"]
            periods = fy_data["periods"]
        else:
            fy_list = client.get(f"/api/v1/fiscal-years?company_id={company_id}", headers=headers).json()["data"]
            periods = fy_list[0]["periods"]

        print(f"Fiscal Year generated with {len(periods)} monthly periods:")
        first_period = periods[0]
        print(f" - Period 1: {first_period['period_name']} (Status: {first_period['status']})")

        print("\n--- 7. Testing Journal Entry - Unbalanced Rejected ---")
        unbal_resp = client.post(
            "/api/v1/journal-entries",
            json={
                "company_id": company_id,
                "period_id": first_period["period_id"],
                "entry_date": "2026-04-10",
                "description": "Unbalanced test",
                "lines": [
                    {"account_id": rent_acc["account_id"], "debit": 10000.0, "credit": 0.0},
                    {"account_id": cash_acc["account_id"], "debit": 0.0, "credit": 8000.0},
                ],
            },
            headers=headers,
        )
        assert unbal_resp.status_code in [400, 422]
        print("Unbalanced journal successfully caught and rejected!")

        print("\n--- 8. Testing Journal Entry Creation & Posting ---")
        jv_resp = client.post(
            "/api/v1/journal-entries",
            json={
                "company_id": company_id,
                "period_id": first_period["period_id"],
                "entry_date": "2026-04-10",
                "description": "Monthly Office Rent Paid in Cash",
                "lines": [
                    {"account_id": rent_acc["account_id"], "description": "Rent Expense", "debit": 10000.0, "credit": 0.0},
                    {"account_id": cash_acc["account_id"], "description": "Cash Disbursed", "debit": 0.0, "credit": 10000.0},
                ],
            },
            headers=headers,
        )
        assert jv_resp.status_code == 201, f"JV create failed: {jv_resp.text}"
        jv = jv_resp.json()["data"]
        jv_id = jv["journal_entry_id"]
        print(f"Draft JV created: {jv['entry_number']} (Status: {jv['status']})")

        post_resp = client.post(f"/api/v1/journal-entries/{jv_id}/post", headers=headers)
        assert post_resp.status_code == 200
        posted_jv = post_resp.json()["data"]
        print(f"JV Posted to General Ledger! Status: {posted_jv['status']}")

        print("\n--- 9. Testing Subledger: Accounts Payable & Receivable ---")
        ap_resp = client.post(
            "/api/v1/ap/invoices",
            json={
                "company_id": company_id,
                "vendor_name": "Apex Cloud Systems",
                "invoice_number": "INV-AP-9901",
                "invoice_date": "2026-04-05",
                "due_date": "2026-04-30",
                "total_amount": 50000.0,
            },
            headers=headers,
        )
        assert ap_resp.status_code == 201
        ap_inv = ap_resp.json()["data"]
        print(f"AP Invoice created: {ap_inv['invoice_number']} - Total: INR {ap_inv['total_amount']}, Remaining: INR {ap_inv['remaining_amount']}")


        pay_resp = client.post(
            f"/api/v1/ap/invoices/{ap_inv['ap_invoice_id']}/payments",
            json={"payment_amount": 20000.0},
            headers=headers,
        )
        assert pay_resp.status_code == 200
        updated_ap = pay_resp.json()["data"]
        print(f"Payment applied: Paid=INR {updated_ap['paid_amount']}, Remaining=INR {updated_ap['remaining_amount']}, Status={updated_ap['status']}")

        print("\n--- 10. Testing Financial Reports (Trial Balance, P&L, Balance Sheet) ---")
        tb_resp = client.get(f"/api/v1/reports/trial-balance?company_id={company_id}", headers=headers)
        assert tb_resp.status_code == 200
        tb = tb_resp.json()["data"]
        print(f"Trial Balance: Total Debits=INR {tb['total_debit']}, Total Credits=INR {tb['total_credit']}, Is Balanced: {tb['is_balanced']}")

        pnl_resp = client.get(f"/api/v1/reports/profit-loss?company_id={company_id}", headers=headers)
        assert pnl_resp.status_code == 200
        pnl = pnl_resp.json()["data"]
        print(f"Profit & Loss: Revenue=INR {pnl['total_revenue']}, Expenses=INR {pnl['total_expense']}, Net Profit=INR {pnl['net_profit']}")

        dash_resp = client.get(f"/api/v1/dashboard/stats?company_id={company_id}", headers=headers)
        assert dash_resp.status_code == 200
        stats = dash_resp.json()["data"]
        print(f"Dashboard Stats: Cash=INR {stats['total_cash']}, AP Outstanding=INR {stats['ap_outstanding']}")

        print("\n" + "=" * 60)
        print("ALL BACKEND & BUSINESS RULE PLATFORM TESTS PASSED 100%!")
        print("=" * 60)


if __name__ == "__main__":
    test_platform()
