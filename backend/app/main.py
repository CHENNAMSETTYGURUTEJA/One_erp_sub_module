import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .core.config import settings
from .core.logging import logger
from .db.database import init_db, SessionLocal
from .models.user import User
from .core.security import hash_password
from .services.company_service import CompanyService
from .services.subledger_service import SubledgerService
from .schemas.company import CompanyCreate
from .utils.response import error_response


from .api.routes import (
    company,
    financial_year,
    accounts,
    journal_entry,
    subledger,
    reports,
    auth,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context: initializes database schema and seeds initial data."""
    logger.info("Initializing STACKLY OneERP database schema in MySQL...")
    init_db()


    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            if settings.ADMIN_PASSWORD:
                admin = User(
                    username="admin",
                    email="admin@thestackly.com",
                    password_hash=hash_password(settings.ADMIN_PASSWORD),
                    role="ADMIN",
                    is_active=True,
                )
                db.add(admin)
                db.commit()
                logger.info("Created initial administrator from environment configuration.")
            else:
                logger.warning("ADMIN_PASSWORD is not set; no administrator account was created.")

        company_service = CompanyService(db)
        companies = company_service.list_companies()
        if not companies:
            from datetime import date
            today = date.today()
            fiscal_start_year = today.year if today.month >= 4 else today.year - 1
            sample_company = CompanyCreate(
                company_name="STACKLY",
                company_code="STACKLY01",
                country="India",
                currency="INR",
                financial_year_start=date(fiscal_start_year, 4, 1),
                company_address="STACKLY Registered Office, Bengaluru, Karnataka, India",
            )
            created_comp = company_service.create_company(sample_company, created_by="ADMIN")
            logger.info(f"Seeded initial company: {created_comp.company_code} - {created_comp.company_name}")
            companies = [created_comp]


        sub_service = SubledgerService(db)
        for comp in companies:
            sub_service.seed_sample_subledger_data(comp.company_id)
    except Exception as e:
        logger.warning(f"Seed note: {e}")
    finally:
        db.close()

    yield
    logger.info("Shutting down STACKLY OneERP server.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="STACKLY Financial Accounting workspace for company setup, periods, ledgers, and subledgers.",
    version=settings.PROJECT_VERSION,
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    formatted_errors = []
    for err in exc.errors():
        field_name = " -> ".join(str(loc) for loc in err.get("loc", []))
        formatted_errors.append({
            "field": field_name,
            "message": err.get("msg", "Invalid input value"),
        })
    return error_response(
        message="Validation failed",
        errors=formatted_errors,
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    )



app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(company.router, prefix=settings.API_V1_PREFIX)
app.include_router(company.router, prefix="/api", include_in_schema=False)
app.include_router(financial_year.router, prefix=settings.API_V1_PREFIX)
app.include_router(accounts.router, prefix=settings.API_V1_PREFIX)
app.include_router(journal_entry.router, prefix=settings.API_V1_PREFIX)
app.include_router(subledger.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)



@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "platform": "STACKLY OneERP",
        "status": "online",
        "version": settings.PROJECT_VERSION,
        "docs_url": "/docs",
    }



FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend"))
SERVE_DIR = FRONTEND_DIST if os.path.isdir(FRONTEND_DIST) else FRONTEND_DIR

if os.path.isdir(SERVE_DIR):
    assets_dir = os.path.join(SERVE_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    app.mount("/static", StaticFiles(directory=SERVE_DIR), name="static")

    @app.get("/", include_in_schema=False)
    def serve_frontend():
        index_path = os.path.join(SERVE_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {
            "message": "Welcome to STACKLY OneERP API",
            "docs": "/docs",
        }
