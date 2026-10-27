from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from ...db.database import get_db
from ...schemas.subledger import ARInvoiceCreate, ARPaymentCreate
from ...services.subledger_service import SubledgerService
from ...utils.exceptions import OneERPException
from ...utils.response import error_response, success_response

router = APIRouter(tags=["Accounts Receivable"])


@router.post("/ar/invoices", status_code=status.HTTP_201_CREATED, summary="Create AR Customer Invoice")
def create_ar_invoice(payload: ARInvoiceCreate, db: Session = Depends(get_db)):
    service = SubledgerService(db)
    try:
        invoice = service.create_ar(payload)
        return success_response(
            message="Customer Invoice registered successfully",
            data=invoice.to_dict(),
            status_code=status.HTTP_201_CREATED,
        )
    except OneERPException as exc:
        return error_response(message=exc.message, status_code=exc.status_code)


@router.get("/ar/invoices", summary="List AR Invoices")
def list_ar_invoices(company_id: int = Query(...), db: Session = Depends(get_db)):
    invoices = SubledgerService(db).list_ar(company_id)
    return success_response(message="AR Invoices retrieved", data=[invoice.to_dict() for invoice in invoices])


@router.get("/ar/ageing", summary="Receivables ageing as of a reporting date")
def ar_ageing(
    company_id: int = Query(...),
    as_of: date = Query(default_factory=date.today),
    db: Session = Depends(get_db),
):
    data = SubledgerService(db).get_ar_ageing(company_id, as_of)
    return success_response(message="Receivables ageing retrieved", data=data)


@router.get("/ar/receipts", summary="Recent customer receipts")
def list_ar_receipts(company_id: int = Query(...), db: Session = Depends(get_db)):
    receipts = SubledgerService(db).list_ar_receipts(company_id)
    return success_response(message="Customer receipts retrieved", data=[receipt.to_dict() for receipt in receipts])


@router.post("/ar/invoices/{ar_invoice_id}/payments", summary="Record Customer Receipt")
def record_ar_payment(
    ar_invoice_id: int,
    payload: ARPaymentCreate,
    db: Session = Depends(get_db),
):
    service = SubledgerService(db)
    try:
        invoice = service.record_ar_payment(
            ar_invoice_id,
            payload.receipt_amount,
            payload.receipt_reference,
            payload.receipt_date,
        )
        return success_response(message="Customer receipt recorded successfully", data=invoice.to_dict())
    except OneERPException as exc:
        return error_response(message=exc.message, status_code=exc.status_code)
