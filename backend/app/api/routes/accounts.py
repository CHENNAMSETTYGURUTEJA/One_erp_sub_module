from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from ...db.database import get_db
from ...services.account_service import AccountService
from ...schemas.account import AccountCreate
from ...utils.response import success_response, error_response
from ...utils.exceptions import OneERPException

router = APIRouter(prefix="/accounts", tags=["Chart of Accounts"])


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create a new account in Chart of Accounts")
def create_account(payload: AccountCreate, db: Session = Depends(get_db)):
    service = AccountService(db)
    try:
        account = service.create_account(payload)
        return success_response(
            message="Account created successfully",
            data=account.to_dict(),
            status_code=status.HTTP_201_CREATED,
        )
    except OneERPException as e:
        return error_response(message=e.message, status_code=e.status_code)


@router.get("", summary="List Chart of Accounts for a company")
def list_accounts(company_id: int = Query(...), db: Session = Depends(get_db)):
    service = AccountService(db)
    accounts = service.list_accounts(company_id)
    return success_response(
        message="Accounts retrieved successfully",
        data=[a.to_dict() for a in accounts],
    )

