from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from ...db.database import get_db
from ...services.account_service import AccountService
from ...schemas.financial_year import FiscalYearCreate, FiscalPeriodStatusUpdate
from ...utils.response import success_response, error_response
from ...utils.exceptions import OneERPException

router = APIRouter(prefix="/fiscal-years", tags=["Fiscal Years & Periods"])


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create Fiscal Year and generate monthly periods")
def create_fiscal_year(payload: FiscalYearCreate, db: Session = Depends(get_db)):
    service = AccountService(db)
    try:
        fy = service.create_fiscal_year(payload)
        return success_response(
            message="Fiscal year and monthly accounting periods created successfully",
            data=fy.to_dict(),
            status_code=status.HTTP_201_CREATED,
        )
    except OneERPException as e:
        return error_response(message=e.message, status_code=e.status_code)


@router.get("", summary="List Fiscal Years with periods")
def list_fiscal_years(company_id: int = Query(...), db: Session = Depends(get_db)):
    service = AccountService(db)
    years = service.list_fiscal_years(company_id)
    return success_response(
        message="Fiscal Years retrieved successfully",
        data=[y.to_dict() for y in years],
    )


@router.put("/periods/{period_id}/status", summary="Toggle Fiscal Period status (OPEN / CLOSED)")
def update_period_status(period_id: int, payload: FiscalPeriodStatusUpdate, db: Session = Depends(get_db)):
    service = AccountService(db)
    try:
        period = service.toggle_period_status(period_id, payload.status)
        return success_response(
            message=f"Period status updated to {payload.status}",
            data=period.to_dict(),
        )
    except OneERPException as e:
        return error_response(message=e.message, status_code=e.status_code)


@router.get("/periods/{period_id}/history", summary="Fiscal period status audit history")
def get_period_history(period_id: int, db: Session = Depends(get_db)):
    service = AccountService(db)
    try:
        history = service.get_period_history(period_id)
        return success_response(message="Fiscal period history retrieved", data=[row.to_dict() for row in history])
    except OneERPException as e:
        return error_response(message=e.message, status_code=e.status_code)

