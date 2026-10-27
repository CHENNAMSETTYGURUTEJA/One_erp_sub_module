from typing import List, Optional
from sqlalchemy.orm import Session
from ..models.company import Company
from ..schemas.company import CompanyCreate, CompanyUpdate


class CompanyRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, company_id: int) -> Optional[Company]:
        return self.db.query(Company).filter(Company.company_id == company_id).first()

    def get_by_code(self, company_code: str) -> Optional[Company]:
        return self.db.query(Company).filter(Company.company_code == company_code.upper()).first()

    def list_all(self, skip: int = 0, limit: int = 100) -> List[Company]:
        return self.db.query(Company).order_by(Company.company_id.desc()).offset(skip).limit(limit).all()

    def create(self, data: CompanyCreate, created_by: str = "ADMIN") -> Company:
        company = Company(
            company_code=data.company_code,
            company_name=data.company_name,
            country=data.country,
            currency=data.currency,
            financial_year_start=data.financial_year_start,
            company_address=data.company_address,
            created_by=created_by,
            updated_by=created_by,
        )
        self.db.add(company)
        self.db.commit()
        self.db.refresh(company)
        return company

    def update(self, company_id: int, data: CompanyUpdate, updated_by: str = "ADMIN") -> Optional[Company]:
        company = self.get_by_id(company_id)
        if not company:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(company, key, value)
        company.updated_by = updated_by

        self.db.commit()
        self.db.refresh(company)
        return company

    def delete(self, company_id: int) -> bool:
        company = self.get_by_id(company_id)
        if not company:
            return False
        self.db.delete(company)
        self.db.commit()
        return True

