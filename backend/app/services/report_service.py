from typing import Dict, Any, List
from sqlalchemy.orm import Session
from ..models.account import Account
from ..models.subledger import APInvoice, ARInvoice
from ..models.journal_entry import JournalEntry


class ReportService:
    def __init__(self, db: Session):
        self.db = db

    def get_trial_balance(self, company_id: int) -> Dict[str, Any]:
        """
        Calculates Trial Balance for all accounts:
        - Asset / Expense: normal debit balance
        - Liability / Equity / Revenue: normal credit balance
        Verifies: Total Debits == Total Credits
        """
        accounts = (
            self.db.query(Account)
            .filter(Account.company_id == company_id)
            .order_by(Account.account_code.asc())
            .all()
        )

        rows = []
        total_debit = 0.0
        total_credit = 0.0

        for acc in accounts:
            bal = float(acc.current_balance or 0.0)
            debit_amt = 0.0
            credit_amt = 0.0

            if acc.account_type in ["Asset", "Expense"]:
                if bal >= 0:
                    debit_amt = bal
                else:
                    credit_amt = abs(bal)
            else:
                if bal >= 0:
                    credit_amt = bal
                else:
                    debit_amt = abs(bal)

            total_debit += debit_amt
            total_credit += credit_amt

            rows.append({
                "account_id": acc.account_id,
                "account_code": acc.account_code,
                "account_name": acc.account_name,
                "account_type": acc.account_type,
                "debit": debit_amt,
                "credit": credit_amt,
            })

        is_balanced = abs(total_debit - total_credit) < 0.01

        return {
            "company_id": company_id,
            "rows": rows,
            "total_debit": round(total_debit, 2),
            "total_credit": round(total_credit, 2),
            "is_balanced": is_balanced,
        }

    def get_profit_and_loss(self, company_id: int) -> Dict[str, Any]:
        """Generates Income Statement: Revenue - Expense = Net Profit."""
        accounts = self.db.query(Account).filter(Account.company_id == company_id).all()

        revenues = []
        expenses = []
        total_revenue = 0.0
        total_expense = 0.0

        for acc in accounts:
            bal = float(acc.current_balance or 0.0)
            if acc.account_type == "Revenue":
                total_revenue += bal
                revenues.append({"code": acc.account_code, "name": acc.account_name, "amount": bal})
            elif acc.account_type == "Expense":
                total_expense += bal
                expenses.append({"code": acc.account_code, "name": acc.account_name, "amount": bal})

        net_profit = total_revenue - total_expense

        return {
            "company_id": company_id,
            "revenues": revenues,
            "expenses": expenses,
            "total_revenue": round(total_revenue, 2),
            "total_expense": round(total_expense, 2),
            "net_profit": round(net_profit, 2),
        }

    def get_balance_sheet(self, company_id: int) -> Dict[str, Any]:
        """Generates Balance Sheet: Assets = Liabilities + Equity."""
        accounts = self.db.query(Account).filter(Account.company_id == company_id).all()

        assets = []
        liabilities = []
        equity = []
        total_assets = 0.0
        total_liabilities = 0.0
        total_equity = 0.0

        for acc in accounts:
            bal = float(acc.current_balance or 0.0)
            item = {"code": acc.account_code, "name": acc.account_name, "amount": bal}
            if acc.account_type == "Asset":
                total_assets += bal
                assets.append(item)
            elif acc.account_type == "Liability":
                total_liabilities += bal
                liabilities.append(item)
            elif acc.account_type == "Equity":
                total_equity += bal
                equity.append(item)


        pnl = self.get_profit_and_loss(company_id)
        net_profit = pnl["net_profit"]
        if net_profit != 0:
            equity.append({"code": "3999", "name": "Current Period Net Earnings", "amount": net_profit})
            total_equity += net_profit

        return {
            "company_id": company_id,
            "assets": assets,
            "liabilities": liabilities,
            "equity": equity,
            "total_assets": round(total_assets, 2),
            "total_liabilities": round(total_liabilities, 2),
            "total_equity": round(total_equity, 2),
            "is_balanced": abs(total_assets - (total_liabilities + total_equity)) < 0.01,
        }

    def get_dashboard_stats(self, company_id: int) -> Dict[str, Any]:
        """Aggregates high-level KPIs for the Executive Dashboard."""

        cash_accounts = (
            self.db.query(Account)
            .filter(
                Account.company_id == company_id,
                Account.account_code.in_(["1001", "1002"]),
            )
            .all()
        )
        total_cash = sum(float(a.current_balance or 0.0) for a in cash_accounts)


        ap_invoices = self.db.query(APInvoice).filter(APInvoice.company_id == company_id).all()
        ap_outstanding = sum(float(inv.remaining_amount or 0.0) for inv in ap_invoices)


        ar_invoices = self.db.query(ARInvoice).filter(ARInvoice.company_id == company_id).all()
        ar_outstanding = sum(float(inv.remaining_amount or 0.0) for inv in ar_invoices)


        total_jv = self.db.query(JournalEntry).filter(JournalEntry.company_id == company_id).count()


        pnl = self.get_profit_and_loss(company_id)

        return {
            "company_id": company_id,
            "total_cash": round(total_cash, 2),
            "ap_outstanding": round(ap_outstanding, 2),
            "ar_outstanding": round(ar_outstanding, 2),
            "total_revenue": pnl["total_revenue"],
            "total_expense": pnl["total_expense"],
            "net_profit": pnl["net_profit"],
            "total_journal_entries": total_jv,
        }

