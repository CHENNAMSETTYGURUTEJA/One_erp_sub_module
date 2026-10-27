from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from ...db.database import get_db
from ...services.company_service import CompanyService
from ...schemas.company import CompanyCreate, CompanyUpdate
from ...utils.response import success_response, error_response
from ...utils.exceptions import OneERPException

router = APIRouter(prefix="/companies", tags=["Company Management"])


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create a new company")
def create_company(payload: CompanyCreate, db: Session = Depends(get_db)):
    """Registers a new company with basic details and seeds default Chart of Accounts."""
    service = CompanyService(db)
    try:
        company = service.create_company(payload)
        return success_response(
            message="Company created successfully",
            data=company.to_dict(),
            status_code=status.HTTP_201_CREATED,
        )
    except OneERPException as e:
        return error_response(message=e.message, status_code=e.status_code)


@router.get("", summary="List all companies")
def list_companies(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Retrieves all registered companies."""
    service = CompanyService(db)
    companies = service.list_companies(skip=skip, limit=limit)
    return success_response(
        message="Companies retrieved successfully",
        data=[c.to_dict() for c in companies],
    )


@router.get("/{company_id}", summary="Get company details")
def get_company(company_id: int, db: Session = Depends(get_db)):
    """Retrieves single company by ID."""
    service = CompanyService(db)
    try:
        company = service.get_company(company_id)
        return success_response(message="Company retrieved successfully", data=company.to_dict())
    except OneERPException as e:
        return error_response(message=e.message, status_code=e.status_code)


@router.put("/{company_id}", summary="Update company details")
def update_company(company_id: int, payload: CompanyUpdate, db: Session = Depends(get_db)):
    """Updates company profile."""
    service = CompanyService(db)
    try:
        company = service.update_company(company_id, payload)
        return success_response(message="Company updated successfully", data=company.to_dict())
    except OneERPException as e:
        return error_response(message=e.message, status_code=e.status_code)


@router.delete("/{company_id}", summary="Delete company")
def delete_company(company_id: int, db: Session = Depends(get_db)):
    """Deletes company profile."""
    service = CompanyService(db)
    try:
        service.delete_company(company_id)
        return success_response(message=f"Company {company_id} deleted successfully")
    except OneERPException as e:
        return error_response(message=e.message, status_code=e.status_code)

