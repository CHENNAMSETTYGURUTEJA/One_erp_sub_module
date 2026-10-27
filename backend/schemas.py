from datetime import date, datetime
from typing import Optional
import re
from pydantic import BaseModel, Field, ConfigDict, field_validator


class CompanyBase(BaseModel):
    """
    Base validation schema with shared fields for Company.
    """
    company_name: str = Field(
        ...,
        min_length=2,
        max_length=150,
        description="Legal or registered business name of the company",
        examples=["STACKLY"]
    )
    company_code: str = Field(
        ...,
        min_length=2,
        max_length=20,
        description="Unique short code identifying the company (e.g., STACKLY01)",
        examples=["STACKLY01"]
    )
    country: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Country of incorporation/operation",
        examples=["India"]
    )
    currency: str = Field(
        ...,
        min_length=2,
        max_length=10,
        description="Standard 3-letter currency code (e.g., INR, USD, EUR)",
        examples=["INR"]
    )
    financial_year_start: date = Field(
        ...,
        description="Start date of the financial year (format: YYYY-MM-DD)",
        examples=["2026-04-01"]
    )
    company_address: str = Field(
        ...,
        min_length=5,
        max_length=500,
        description="Registered office address of the company",
        examples=["Plot 42, Electronic City Phase 1, Bengaluru, Karnataka, 560100"]
    )

    @field_validator("company_name", "country", "company_address", mode="before")
    @classmethod
    def strip_whitespace(cls, value: str) -> str:
        if isinstance(value, str):
            value = value.strip()
            if not value:
                raise ValueError("Field cannot be empty or only whitespace")
        return value

    @field_validator("company_code")
    @classmethod
    def validate_and_format_code(cls, value: str) -> str:
        if not isinstance(value, str):
            raise ValueError("Company code must be a string")
        cleaned = value.strip().upper()
        if not re.match(r"^[A-Z0-9_\-]+$", cleaned):
            raise ValueError(
                "Company code must contain only alphanumeric characters, dashes, or underscores"
            )
        return cleaned

    @field_validator("currency")
    @classmethod
    def validate_and_format_currency(cls, value: str) -> str:
        if not isinstance(value, str):
            raise ValueError("Currency must be a string")
        cleaned = value.strip().upper()
        if not re.match(r"^[A-Z]{2,5}$", cleaned):
            raise ValueError("Currency should be a valid currency code (e.g. INR, USD, EUR, GBP)")
        return cleaned


class CompanyCreate(CompanyBase):
    """
    Schema for creating a new company entry.
    """
    pass


class CompanyUpdate(BaseModel):
    """
    Schema for updating company details. All fields are optional.
    """
    company_name: Optional[str] = Field(None, min_length=2, max_length=150)
    country: Optional[str] = Field(None, min_length=2, max_length=100)
    currency: Optional[str] = Field(None, min_length=2, max_length=10)
    financial_year_start: Optional[date] = None
    company_address: Optional[str] = Field(None, min_length=5, max_length=500)

    @field_validator("currency")
    @classmethod
    def validate_currency_if_present(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            cleaned = value.strip().upper()
            if not re.match(r"^[A-Z]{2,5}$", cleaned):
                raise ValueError("Currency should be a valid currency code (e.g. INR, USD, EUR)")
            return cleaned
        return value


class CompanyResponse(CompanyBase):
    """
    Schema for returning company data to the client, including database IDs and timestamps.
    """
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
