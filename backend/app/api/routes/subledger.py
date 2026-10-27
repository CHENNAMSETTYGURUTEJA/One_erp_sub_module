from decimal import Decimal
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from ...db.database import get_db
from ...services.subledger_service import SubledgerService
from ...schemas.subledger import (
    APInvoiceCreate, APPaymentCreate, ARInvoiceCreate, ARPaymentCreate,
    FixedAssetCreate, DepreciationRecord, BudgetCreate, GSTRecordCreate
)
from ...utils.response import success_response, error_response
from ...utils.exceptions import OneERPException

router = APIRouter(tags=["AP, AR, Assets, Budget & GST"])



@router.post("/ap/invoices", status_code=status.HTTP_201_CREATED, summary="Create AP Supplier Invoice")
def create_ap_invoice(payload: APInvoiceCreate, db: Session = Depends(get_db)):
    service = SubledgerService(db)
    try:
        inv = service.create_ap(payload)
        return success_response(
            message="Supplier Invoice registered successfully",
            data=inv.to_dict(),
            status_code=status.HTTP_201_CREATED,
        )
    except OneERPException as e:
        return error_response(message=e.message, status_code=e.status_code)


@router.get("/ap/invoices", summary="List AP Invoices")
def list_ap_invoices(company_id: int = Query(...), db: Session = Depends(get_db)):
    service = SubledgerService(db)
    invoices = service.list_ap(company_id)
    return success_response(message="AP Invoices retrieved", data=[i.to_dict() for i in invoices])


@router.post("/ap/invoices/{ap_invoice_id}/payments", summary="Record Payment to Supplier")
def record_ap_payment(ap_invoice_id: int, payload: APPaymentCreate, db: Session = Depends(get_db)):
    service = SubledgerService(db)
    try:
        inv = service.record_ap_payment(ap_invoice_id, payload.payment_amount)
        return success_response(message="Supplier payment recorded successfully", data=inv.to_dict())
    except OneERPException as e:
        return error_response(message=e.message, status_code=e.status_code)



@router.post("/ar/invoices", status_code=status.HTTP_201_CREATED, summary="Create AR Customer Invoice")
def create_ar_invoice(payload: ARInvoiceCreate, db: Session = Depends(get_db)):
    service = SubledgerService(db)
    try:
        inv = service.create_ar(payload)
        return success_response(
            message="Customer Invoice registered successfully",
            data=inv.to_dict(),
            status_code=status.HTTP_201_CREATED,
        )
    except OneERPException as e:
        return error_response(message=e.message, status_code=e.status_code)


@router.get("/ar/invoices", summary="List AR Invoices")
def list_ar_invoices(company_id: int = Query(...), db: Session = Depends(get_db)):
    service = SubledgerService(db)
    invoices = service.list_ar(company_id)
    return success_response(message="AR Invoices retrieved", data=[i.to_dict() for i in invoices])


@router.get("/ar/ageing", summary="Receivables ageing as of a reporting date")
def ar_ageing(company_id: int = Query(...), as_of: date = Query(default_factory=date.today), db: Session = Depends(get_db)):
    data = SubledgerService(db).get_ar_ageing(company_id, as_of)
    return success_response(message="Receivables ageing retrieved", data=data)


@router.get("/ar/receipts", summary="Recent customer receipts")
def list_ar_receipts(company_id: int = Query(...), db: Session = Depends(get_db)):
    receipts = SubledgerService(db).list_ar_receipts(company_id)
    return success_response(message="Customer receipts retrieved", data=[r.to_dict() for r in receipts])


@router.post("/ar/invoices/{ar_invoice_id}/payments", summary="Record Customer Receipt")
def record_ar_payment(ar_invoice_id: int, payload: ARPaymentCreate, db: Session = Depends(get_db)):
    service = SubledgerService(db)
    try:
        inv = service.record_ar_payment(ar_invoice_id, payload.receipt_amount, payload.receipt_reference, payload.receipt_date)
        return success_response(message="Customer receipt recorded successfully", data=inv.to_dict())
    except OneERPException as e:
        return error_response(message=e.message, status_code=e.status_code)



@router.post("/assets", status_code=status.HTTP_201_CREATED, summary="Register Fixed Asset")
def create_asset(payload: FixedAssetCreate, db: Session = Depends(get_db)):
    service = SubledgerService(db)
    try:
        asset = service.create_asset(payload)
        return success_response(
            message="Fixed Asset registered successfully",
            data=asset.to_dict(),
            status_code=status.HTTP_201_CREATED,
        )
    except OneERPException as e:
        return error_response(message=e.message, status_code=e.status_code)


@router.get("/assets", summary="List Fixed Assets")
def list_assets(company_id: int = Query(...), db: Session = Depends(get_db)):
    service = SubledgerService(db)
    assets = service.list_assets(company_id)
    return success_response(message="Fixed Assets retrieved", data=[a.to_dict() for a in assets])


@router.post("/assets/{asset_id}/depreciate", summary="Record Asset Depreciation")
def record_depreciation(asset_id: int, payload: DepreciationRecord, db: Session = Depends(get_db)):
    service = SubledgerService(db)
    try:
        asset = service.record_depreciation(asset_id, payload.depreciation_amount)
        return success_response(message="Depreciation recorded successfully", data=asset.to_dict())
    except OneERPException as e:
        return error_response(message=e.message, status_code=e.status_code)



@router.post("/budgets", summary="Set / Update Budget")
def set_budget(payload: BudgetCreate, db: Session = Depends(get_db)):
    service = SubledgerService(db)
    try:
        b = service.set_budget(payload)
        return success_response(message="Budget set successfully", data=b.to_dict())
    except OneERPException as e:
        return error_response(message=e.message, status_code=e.status_code)


@router.get("/budgets", summary="List Budgets")
def list_budgets(
    company_id: int = Query(...),
    fiscal_year_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    service = SubledgerService(db)
    budgets = service.list_budgets(company_id, fiscal_year_id)
    return success_response(message="Budgets retrieved", data=[b.to_dict() for b in budgets])



@router.post("/gst", status_code=status.HTTP_201_CREATED, summary="Record GST Transaction")
def record_gst(payload: GSTRecordCreate, db: Session = Depends(get_db)):
    service = SubledgerService(db)
    try:
        gst = service.record_gst(payload)
        return success_response(
            message="GST transaction recorded successfully",
            data=gst.to_dict(),
            status_code=status.HTTP_201_CREATED,
        )
    except OneERPException as e:
        return error_response(message=e.message, status_code=e.status_code)


@router.get("/gst", summary="List GST Transactions")
def list_gst(company_id: int = Query(...), db: Session = Depends(get_db)):
    service = SubledgerService(db)
    records = service.list_gst(company_id)
    return success_response(message="GST records retrieved", data=[r.to_dict() for r in records])



@router.post("/subledger/seed-sample-data", summary="Seed Sample AP, AR, Assets, Budget & GST Demo Data")
def seed_sample_data(company_id: int = Query(...), db: Session = Depends(get_db)):
    service = SubledgerService(db)
    try:
        counts = service.seed_sample_subledger_data(company_id)
        return success_response(
            message=f"Sample subledger data seeded successfully for company {company_id}",
            data=counts,
        )
    except OneERPException as e:
        return error_response(message=e.message, status_code=e.status_code)

