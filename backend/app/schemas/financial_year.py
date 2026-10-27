from datetime import date
from typing import Optional, List
from pydantic import BaseModel, Field


class FiscalPeriodResponse(BaseModel):
    period_id: int
    fiscal_year_id: int
    period_number: int
    period_name: str
    start_date: date
    end_date: date
    status: str


class FiscalPeriodStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(OPEN|CLOSED)$", description="Must be 'OPEN' or 'CLOSED'")


class FiscalYearCreate(BaseModel):
    company_id: int
    year_name: str = Field(..., min_length=4, max_length=50, examples=["FY 2026-2027"])
    start_date: date = Field(..., examples=["2026-04-01"])
    end_date: date = Field(..., examples=["2027-03-31"])


class FiscalYearResponse(BaseModel):
    fiscal_year_id: int
    company_id: int
    year_name: str
    start_date: date
    end_date: date
    is_active: bool
    periods: List[FiscalPeriodResponse] = []

