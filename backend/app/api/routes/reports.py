from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ...db.database import get_db
from ...services.report_service import ReportService
from ...utils.response import success_response

router = APIRouter(tags=["Financial Reports & Analytics"])


@router.get("/reports/trial-balance", summary="Generate Trial Balance Report")
def get_trial_balance(company_id: int = Query(...), db: Session = Depends(get_db)):
    service = ReportService(db)
    tb = service.get_trial_balance(company_id)
    return success_response(message="Trial Balance generated successfully", data=tb)


@router.get("/reports/profit-loss", summary="Generate Profit & Loss (Income Statement)")
def get_profit_and_loss(company_id: int = Query(...), db: Session = Depends(get_db)):
    service = ReportService(db)
    pnl = service.get_profit_and_loss(company_id)
    return success_response(message="Profit & Loss statement generated successfully", data=pnl)


@router.get("/reports/balance-sheet", summary="Generate Balance Sheet")
def get_balance_sheet(company_id: int = Query(...), db: Session = Depends(get_db)):
    service = ReportService(db)
    bs = service.get_balance_sheet(company_id)
    return success_response(message="Balance Sheet generated successfully", data=bs)


@router.get("/dashboard/stats", summary="Get Executive Dashboard Stats & KPIs")
def get_dashboard_stats(company_id: int = Query(...), db: Session = Depends(get_db)):
    service = ReportService(db)
    stats = service.get_dashboard_stats(company_id)
    return success_response(message="Dashboard statistics retrieved successfully", data=stats)

