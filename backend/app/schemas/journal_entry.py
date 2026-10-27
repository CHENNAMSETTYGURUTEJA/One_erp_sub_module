from datetime import date
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, model_validator


class JournalEntryLineCreate(BaseModel):
    account_id: int
    description: Optional[str] = None
    debit: Decimal = Field(default=Decimal("0.00"), ge=0)
    credit: Decimal = Field(default=Decimal("0.00"), ge=0)


class JournalEntryCreate(BaseModel):
    company_id: int
    period_id: int
    entry_date: date
    description: str = Field(..., min_length=3, max_length=255)
    reference: Optional[str] = None
    lines: List[JournalEntryLineCreate] = Field(..., min_length=2)

    @model_validator(mode="after")
    def check_balanced_debit_credit(self):
        total_debit = sum(line.debit for line in self.lines)
        total_credit = sum(line.credit for line in self.lines)
        if abs(total_debit - total_credit) > Decimal("0.001"):
            raise ValueError(
                f"Journal Entry is unbalanced: Total Debits ({total_debit:.2f}) "
                f"must equal Total Credits ({total_credit:.2f})."
            )
        if total_debit <= 0:
            raise ValueError("Journal Entry total debit amount must be greater than 0.")
        return self


class JournalEntryLineResponse(BaseModel):
    line_id: int
    account_id: int
    account_code: Optional[str] = None
    account_name: Optional[str] = None
    description: Optional[str] = None
    debit: float
    credit: float


class JournalEntryResponse(BaseModel):
    journal_entry_id: int
    company_id: int
    period_id: int
    entry_number: str
    entry_date: date
    description: str
    reference: Optional[str] = None
    total_debit: float
    total_credit: float
    status: str
    created_at: Optional[str] = None
    posted_at: Optional[str] = None
    lines: List[JournalEntryLineResponse] = []

