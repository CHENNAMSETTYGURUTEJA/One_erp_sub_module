import os
import sys
from typing import List, Optional
from sqlalchemy.orm import Session

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

try:
    from . import models, schemas
except ImportError:
    import models, schemas


class CompanyCodeAlreadyExistsError(Exception):
    """Raised when attempting to create a company with a code that already exists."""
    pass


def get_company(db: Session, company_id: int) -> Optional[models.Company]:
    """Retrieve a single company by its primary key ID."""
    return db.query(models.Company).filter(models.Company.id == company_id).first()


def get_company_by_code(db: Session, company_code: str) -> Optional[models.Company]:
    """Retrieve a single company by its unique company code (case-insensitive check)."""
    return db.query(models.Company).filter(
        models.Company.company_code == company_code.upper()
    ).first()


def get_companies(db: Session, skip: int = 0, limit: int = 100) -> List[models.Company]:
    """
    Retrieve a paginated list of companies ordered by newest first.
    """
    return (
        db.query(models.Company)
        .order_by(models.Company.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_company(db: Session, company_data: schemas.CompanyCreate) -> models.Company:
    """
    Create a new company record in the database.
    Business Rules:
    - Company code must be unique across the entire ERP system.
    """
    existing_company = get_company_by_code(db, company_data.company_code)
    if existing_company:
        raise CompanyCodeAlreadyExistsError(
            f"Company code '{company_data.company_code}' is already registered with company '{existing_company.company_name}'."
        )

    db_company = models.Company(
        company_name=company_data.company_name,
        company_code=company_data.company_code,
        country=company_data.country,
        currency=company_data.currency,
        financial_year_start=company_data.financial_year_start,
        company_address=company_data.company_address,
    )
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company


def update_company(
    db: Session, company_id: int, update_data: schemas.CompanyUpdate
) -> Optional[models.Company]:
    """
    Update an existing company record.
    """
    db_company = get_company(db, company_id)
    if not db_company:
        return None

    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(db_company, field, value)

    db.commit()
    db.refresh(db_company)
    return db_company


def delete_company(db: Session, company_id: int) -> bool:
    """
    Delete a company record by ID.
    Returns True if deleted, False if not found.
    """
    db_company = get_company(db, company_id)
    if not db_company:
        return False

    db.delete(db_company)
    db.commit()
    return True
