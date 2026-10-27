"""
Verification script for SAPONE ERP Company Setup Backend.
Tests database creation, Pydantic validation, CRUD logic, and FastAPI endpoints.
"""
import sys
from datetime import date
from fastapi.testclient import TestClient


from backend.main import app
from backend.database import SessionLocal, init_db
from backend.models import Company


def run_tests():
    print(">>> 1. Initializing Database...")
    init_db()


    db = SessionLocal()
    try:
        db.query(Company).filter(Company.company_code == "STKTEST0").delete()
        db.commit()
    finally:
        db.close()

    client = TestClient(app)

    print(">>> 2. Testing Root Health Check...")
    response = client.get("/")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    print("    Root endpoint OK:", response.json())

    print(">>> 3. Testing Company Creation (POST /api/companies/)...")
    payload = {
        "company_name": "STACKLY Test Company",
        "company_code": "STKTEST0",
        "country": "India",
        "currency": "INR",
        "financial_year_start": "2026-04-01",
        "company_address": "Plot 42, Electronic City Phase 1, Bengaluru, Karnataka, 560100"
    }
    response = client.post("/api/companies/", json=payload)
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
    created_data = response.json()
    print("    Company Created Successfully:")
    print("    - ID:", created_data["id"])
    print("    - Name:", created_data["company_name"])
    print("    - Code:", created_data["company_code"])
    print("    - Currency:", created_data["currency"])
    print("    - Financial Year Start:", created_data["financial_year_start"])

    company_id = created_data["id"]

    print(">>> 4. Testing Duplicate Company Code Rejection...")
    dup_response = client.post("/api/companies/", json=payload)
    assert dup_response.status_code == 400, f"Expected 400 for duplicate code, got {dup_response.status_code}"
    print("    Duplicate check passed! Error returned:", dup_response.json()["detail"])

    print(">>> 5. Testing Company List (GET /api/companies/)...")
    list_response = client.get("/api/companies/")
    assert list_response.status_code == 200
    companies = list_response.json()
    assert any(c["company_code"] == "STKTEST0" for c in companies), "Created company not found in list"
    print(f"    Company List retrieved successfully ({len(companies)} company/companies found).")

    print(">>> 6. Testing Get Company by ID (GET /api/companies/{id})...")
    get_response = client.get(f"/api/companies/{company_id}")
    assert get_response.status_code == 200
    assert get_response.json()["company_name"] == "STACKLY Test Company"
    print("    Get Company by ID verified.")

    print(">>> 7. Testing Validation Error on Invalid Currency Code...")
    bad_payload = {
        "company_name": "Invalid Test Ltd",
        "company_code": "INV001",
        "country": "India",
        "currency": "12345",
        "financial_year_start": "2026-04-01",
        "company_address": "Test Address"
    }
    bad_response = client.post("/api/companies/", json=bad_payload)
    assert bad_response.status_code == 422, f"Expected 422 Unprocessable Entity, got {bad_response.status_code}"
    print("    Validation error caught properly on invalid currency!")

    print("\nALL BACKEND TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    run_tests()

