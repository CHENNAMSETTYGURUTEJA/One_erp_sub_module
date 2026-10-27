from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class AccountCreate(BaseModel):
    company_id: int
    account_code: str = Field(..., min_length=2, max_length=20, examples=["1001"])
    account_name: str = Field(..., min_length=2, max_length=100, examples=["Cash Account"])
    account_type: str = Field(..., examples=["Asset"], description="Asset, Liability, Equity, Revenue, Expense")
    opening_balance: Optional[Decimal] = Field(Decimal("0.00"), ge=0)

    @field_validator("account_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        valid_types = {"Asset", "Liability", "Equity", "Revenue", "Expense"}
        normalized = v.capitalize()
        if normalized not in valid_types:
            raise ValueError(f"Account type must be one of: {', '.join(valid_types)}")
        return normalized

    @field_validator("account_code")
    @classmethod
    def format_code(cls, v: str) -> str:
        return v.strip().upper()


class AccountUpdate(BaseModel):
    account_name: Optional[str] = Field(None, min_length=2, max_length=100)
    is_active: Optional[bool] = None


class AccountResponse(BaseModel):
    account_id: int
    company_id: int
    account_code: str
    account_name: str
    account_type: str
    opening_balance: float
    current_balance: float
    is_active: bool

