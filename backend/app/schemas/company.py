from datetime import date, datetime
from typing import Optional
import re
from pydantic import BaseModel, Field, ConfigDict, field_validator


class CompanyBase(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=150, examples=["STACKLY"])
    company_code: str = Field(..., min_length=2, max_length=20, examples=["STACKLY01"])
    country: str = Field(..., min_length=2, max_length=100, examples=["India"])
    currency: str = Field(..., min_length=2, max_length=10, examples=["INR"])
    financial_year_start: date = Field(..., examples=["2026-04-01"])
    company_address: str = Field(..., min_length=3, max_length=500, examples=["Plot 42, Electronic City, Bengaluru, 560100"])

    @field_validator("company_name", "country", "company_address", mode="before")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                raise ValueError("Field cannot be blank")
        return v

    @field_validator("company_code")
    @classmethod
    def format_company_code(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Company code must be a string")
        cleaned = v.strip().upper()
        if not re.match(r"^[A-Z0-9_\-]+$", cleaned):
            raise ValueError("Company code must be alphanumeric (letters, numbers, dash, underscore)")
        return cleaned

    @field_validator("currency")
    @classmethod
    def format_currency(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Currency must be a string")
        cleaned = v.strip().upper()
        if not re.match(r"^[A-Z]{2,5}$", cleaned):
            raise ValueError("Currency must be a valid 2-5 letter code (e.g. INR, USD, EUR)")
        return cleaned


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=2, max_length=150)
    country: Optional[str] = Field(None, min_length=2, max_length=100)
    currency: Optional[str] = Field(None, min_length=2, max_length=10)
    financial_year_start: Optional[date] = None
    company_address: Optional[str] = Field(None, min_length=3, max_length=500)


class CompanyResponse(CompanyBase):
    company_id: int
    created_at: datetime
    created_by: str
    updated_at: datetime
    updated_by: str

    model_config = ConfigDict(from_attributes=True)
