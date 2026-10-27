from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import uuid4
from pydantic import BaseModel, Field, model_validator



class APInvoiceCreate(BaseModel):
    company_id: int
    vendor_name: str = Field(..., min_length=2, max_length=150)
    invoice_number: str = Field(..., min_length=2, max_length=50)
    invoice_date: date
    due_date: date
    total_amount: Decimal = Field(..., gt=0)


class APPaymentCreate(BaseModel):
    payment_amount: Decimal = Field(..., gt=0)



class ARInvoiceCreate(BaseModel):
    company_id: int
    customer_name: str = Field(..., min_length=2, max_length=150)
    invoice_number: str = Field(..., min_length=2, max_length=50)
    invoice_date: date
    due_date: date
    total_amount: Decimal = Field(..., gt=0)

    @model_validator(mode="after")
    def validate_due_date(self):
        if self.due_date < self.invoice_date:
            raise ValueError("Due date cannot be earlier than invoice date.")
        return self


class ARPaymentCreate(BaseModel):
    receipt_amount: Decimal = Field(..., gt=0)
    receipt_date: date = Field(default_factory=date.today)
    receipt_reference: str = Field(default_factory=lambda: str(uuid4()), min_length=8, max_length=64)



class FixedAssetCreate(BaseModel):
    company_id: int
    asset_code: str = Field(..., min_length=2, max_length=30)
    asset_name: str = Field(..., min_length=2, max_length=150)
    category: str = Field(..., min_length=2, max_length=100)
    purchase_date: date
    purchase_cost: Decimal = Field(..., gt=0)


class DepreciationRecord(BaseModel):
    depreciation_amount: Decimal = Field(..., gt=0)



class BudgetCreate(BaseModel):
    company_id: int
    fiscal_year_id: int
    account_id: int
    budgeted_amount: Decimal = Field(..., ge=0)



class GSTRecordCreate(BaseModel):
    company_id: int
    transaction_ref: str
    hsn_sac: str
    taxable_value: Decimal = Field(..., gt=0)
    cgst_rate_percent: Decimal = Field(Decimal("9.0"), ge=0)
    sgst_rate_percent: Decimal = Field(Decimal("9.0"), ge=0)
    igst_rate_percent: Decimal = Field(Decimal("0.0"), ge=0)

