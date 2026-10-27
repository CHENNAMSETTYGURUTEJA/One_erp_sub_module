from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from ...db.database import get_db
from ...services.journal_service import JournalService
from ...schemas.journal_entry import JournalEntryCreate
from ...utils.response import success_response, error_response
from ...utils.exceptions import OneERPException

router = APIRouter(tags=["Journal Entries & General Ledger"])


@router.post("/journal-entries", status_code=status.HTTP_201_CREATED, summary="Create Journal Entry (Draft)")
def create_journal_entry(payload: JournalEntryCreate, db: Session = Depends(get_db)):
    service = JournalService(db)
    try:
        entry = service.create_journal_entry(payload)
        return success_response(
            message=f"Journal Entry {entry.entry_number} created successfully",
            data=entry.to_dict(),
            status_code=status.HTTP_201_CREATED,
        )
    except OneERPException as e:
        return error_response(message=e.message, status_code=e.status_code)


@router.get("/journal-entries", summary="List Journal Entries")
def list_journal_entries(
    company_id: int = Query(...),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    service = JournalService(db)
    entries = service.list_entries(company_id, status_filter)
    return success_response(
        message="Journal Entries retrieved successfully",
        data=[e.to_dict() for e in entries],
    )


@router.get("/journal-entries/{journal_entry_id}", summary="Get Journal Entry by ID")
def get_journal_entry(journal_entry_id: int, db: Session = Depends(get_db)):
    service = JournalService(db)
    try:
        entry = service.get_entry(journal_entry_id)
        return success_response(message="Journal Entry retrieved successfully", data=entry.to_dict())
    except OneERPException as e:
        return error_response(message=e.message, status_code=e.status_code)


@router.post("/journal-entries/{journal_entry_id}/post", summary="Post Journal Entry to General Ledger")
def post_journal_entry(journal_entry_id: int, db: Session = Depends(get_db)):
    service = JournalService(db)
    try:
        entry = service.post_journal_entry(journal_entry_id)
        return success_response(
            message=f"Journal Entry {entry.entry_number} posted successfully to General Ledger",
            data=entry.to_dict(),
        )
    except OneERPException as e:
        return error_response(message=e.message, status_code=e.status_code)


@router.get("/gl/account/{account_id}", summary="Get Account General Ledger Statement")
def get_account_gl(account_id: int, company_id: int = Query(...), db: Session = Depends(get_db)):
    service = JournalService(db)
    try:
        gl = service.get_account_gl(company_id, account_id)
        return success_response(message="General Ledger retrieved successfully", data=gl)
    except OneERPException as e:
        return error_response(message=e.message, status_code=e.status_code)

