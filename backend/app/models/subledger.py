from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Date, Numeric, ForeignKey, DateTime
from ..db.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class APInvoice(Base):
    """Accounts Payable (AP) Supplier Invoices."""
    __tablename__ = "ap_invoices"

    ap_invoice_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False, index=True)
    vendor_name = Column(String(150), nullable=False)
    invoice_number = Column(String(50), nullable=False)
    invoice_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    total_amount = Column(Numeric(15, 2), nullable=False)
    paid_amount = Column(Numeric(15, 2), default=0.00, nullable=False)
    remaining_amount = Column(Numeric(15, 2), nullable=False)
    status = Column(String(20), default="UNPAID", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    def to_dict(self):
        return {
            "ap_invoice_id": self.ap_invoice_id,
            "company_id": self.company_id,
            "vendor_name": self.vendor_name,
            "invoice_number": self.invoice_number,
            "invoice_date": str(self.invoice_date) if self.invoice_date else None,
            "due_date": str(self.due_date) if self.due_date else None,
            "total_amount": float(self.total_amount or 0.0),
            "paid_amount": float(self.paid_amount or 0.0),
            "remaining_amount": float(self.remaining_amount or 0.0),
            "status": self.status,
            "created_at": str(self.created_at) if self.created_at else None,
        }


class ARInvoice(Base):
    """Accounts Receivable (AR) Customer Invoices."""
    __tablename__ = "ar_invoices"

    ar_invoice_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False, index=True)
    customer_name = Column(String(150), nullable=False)
    invoice_number = Column(String(50), nullable=False)
    invoice_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    total_amount = Column(Numeric(15, 2), nullable=False)
    received_amount = Column(Numeric(15, 2), default=0.00, nullable=False)
    remaining_amount = Column(Numeric(15, 2), nullable=False)
    status = Column(String(20), default="UNPAID", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    def to_dict(self):
        return {
            "ar_invoice_id": self.ar_invoice_id,
            "company_id": self.company_id,
            "customer_name": self.customer_name,
            "invoice_number": self.invoice_number,
            "invoice_date": str(self.invoice_date) if self.invoice_date else None,
            "due_date": str(self.due_date) if self.due_date else None,
            "total_amount": float(self.total_amount or 0.0),
            "received_amount": float(self.received_amount or 0.0),
            "remaining_amount": float(self.remaining_amount or 0.0),
            "status": self.status,
            "created_at": str(self.created_at) if self.created_at else None,
        }


class ARReceipt(Base):
    """Immutable record of a receipt applied to an AR invoice."""
    __tablename__ = "ar_receipts"

    receipt_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ar_invoice_id = Column(Integer, ForeignKey("ar_invoices.ar_invoice_id"), nullable=False, index=True)
    receipt_reference = Column(String(64), nullable=False, unique=True, index=True)
    receipt_date = Column(Date, nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    def to_dict(self):
        return {
            "receipt_id": self.receipt_id,
            "ar_invoice_id": self.ar_invoice_id,
            "receipt_reference": self.receipt_reference,
            "receipt_date": str(self.receipt_date),
            "amount": float(self.amount),
            "created_at": str(self.created_at) if self.created_at else None,
        }


class FixedAsset(Base):
    """Fixed Assets Master Model."""
    __tablename__ = "fixed_assets"

    asset_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False, index=True)
    asset_code = Column(String(30), nullable=False)
    asset_name = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False)
    purchase_date = Column(Date, nullable=False)
    purchase_cost = Column(Numeric(15, 2), nullable=False)
    accumulated_depreciation = Column(Numeric(15, 2), default=0.00, nullable=False)
    current_net_value = Column(Numeric(15, 2), nullable=False)
    status = Column(String(20), default="ACTIVE", nullable=False)

    def to_dict(self):
        return {
            "asset_id": self.asset_id,
            "company_id": self.company_id,
            "asset_code": self.asset_code,
            "asset_name": self.asset_name,
            "category": self.category,
            "purchase_date": str(self.purchase_date) if self.purchase_date else None,
            "purchase_cost": float(self.purchase_cost or 0.0),
            "accumulated_depreciation": float(self.accumulated_depreciation or 0.0),
            "current_net_value": float(self.current_net_value or 0.0),
            "status": self.status,
        }


class Budget(Base):
    """Budgeting Master Model comparing Plan vs Actual."""
    __tablename__ = "budgets"

    budget_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False, index=True)
    fiscal_year_id = Column(Integer, ForeignKey("fiscal_years.fiscal_year_id"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.account_id"), nullable=False)
    budgeted_amount = Column(Numeric(15, 2), nullable=False)
    actual_amount = Column(Numeric(15, 2), default=0.00, nullable=False)

    def to_dict(self):
        variance = float(self.budgeted_amount or 0.0) - float(self.actual_amount or 0.0)
        return {
            "budget_id": self.budget_id,
            "company_id": self.company_id,
            "fiscal_year_id": self.fiscal_year_id,
            "account_id": self.account_id,
            "budgeted_amount": float(self.budgeted_amount or 0.0),
            "actual_amount": float(self.actual_amount or 0.0),
            "variance": variance,
        }


class GSTRecord(Base):
    """GST Compliance Record Model."""
    __tablename__ = "gst_records"

    gst_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False, index=True)
    transaction_ref = Column(String(50), nullable=False)
    hsn_sac = Column(String(20), nullable=False)
    taxable_value = Column(Numeric(15, 2), nullable=False)
    cgst_amount = Column(Numeric(15, 2), default=0.00, nullable=False)
    sgst_amount = Column(Numeric(15, 2), default=0.00, nullable=False)
    igst_amount = Column(Numeric(15, 2), default=0.00, nullable=False)
    total_tax = Column(Numeric(15, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    def to_dict(self):
        return {
            "gst_id": self.gst_id,
            "company_id": self.company_id,
            "transaction_ref": self.transaction_ref,
            "hsn_sac": self.hsn_sac,
            "taxable_value": float(self.taxable_value or 0.0),
            "cgst_amount": float(self.cgst_amount or 0.0),
            "sgst_amount": float(self.sgst_amount or 0.0),
            "igst_amount": float(self.igst_amount or 0.0),
            "total_tax": float(self.total_tax or 0.0),
            "created_at": str(self.created_at) if self.created_at else None,
        }

