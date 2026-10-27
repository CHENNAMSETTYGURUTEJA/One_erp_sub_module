# STACKLY OneERP Cloud Platform
## Commercial ERP SaaS — FICO & Business Cloud Modules

This platform follows the **STACKLY OneERP Python Backend Development Standard & Template** and the **FICO Business Story**.

---

## 🏗️ Architecture & Project Folder Structure

```text
SAPONE_ERP/
├── run.py                          # Unified launcher (starts backend + web app)
├── frontend/                       # Interactive Web Application (SPA)
│   ├── index.html                  # Main responsive ERP workspace
│   ├── css/
│   │   └── styles.css              # Custom layout, tabular numbers, live dots
│   ├── js/
│   │   ├── api.js                  # Unified API client (/api/v1)
│   │   └── app.js                  # Reactive state, tabs, balance validators
│   └── assets/
│       └── logo.svg                # STACKLY brand vector logo
└── backend/
    ├── run.py                      # Local runner script
    ├── tests/
    │   └── test_full_platform.py   # E2E test suite covering all modules & rules
    └── app/
        ├── core/
        │   ├── config.py           # Pydantic Settings & MySQL connection URL
        │   ├── security.py         # Password hashing & JWT token generation
        │   └── logging.py          # Section 10 compliant logging (masks secrets)
        ├── db/
        │   └── database.py         # SQLAlchemy engine, pool, session, init_db
        ├── models/                 # Database Models (Section 6 table_id standard)
        │   ├── company.py          # companies table
        │   ├── financial_year.py   # fiscal_years & fiscal_periods tables
        │   ├── account.py          # accounts table (Chart of Accounts)
        │   ├── journal_entry.py    # journal_entries & journal_entry_lines
        │   ├── subledger.py        # ap_invoices, ar_invoices, fixed_assets, budgets, gst
        │   └── user.py             # users table with RBAC roles
        ├── schemas/                # Pydantic v2 validation models
        │   ├── company.py
        │   ├── financial_year.py
        │   ├── account.py
        │   ├── journal_entry.py
        │   ├── subledger.py
        │   └── auth.py
        ├── repositories/           # Data access layer
        │   ├── company_repository.py
        │   ├── account_repository.py
        │   ├── journal_repository.py
        │   └── subledger_repository.py
        ├── services/               # Business logic & validations (Section 8)
        │   ├── company_service.py
        │   ├── account_service.py
        │   ├── journal_service.py  # Enforces Debit == Credit & Period Open check
        │   ├── subledger_service.py
        │   └── report_service.py   # Trial Balance, P&L, Balance Sheet, Dashboard
        ├── utils/
        │   ├── constants.py
        │   ├── exceptions.py
        │   └── response.py         # Section 4 standardized response envelopes
        ├── api/
        │   ├── dependencies.py     # Auth, DB, and RBAC permission checks
        │   └── routes/             # RESTful API endpoints (/api/v1/...)
        │       ├── auth.py
        │       ├── company.py
        │       ├── financial_year.py
        │       ├── accounts.py
        │       ├── journal_entry.py
        │       ├── subledger.py
        │       └── reports.py
        └── main.py                 # FastAPI application & SPA mounting
```

---

## 🗄️ MySQL Database (Schema: `one_erp`)

- **Host**: `localhost:3306`
- **Database**: `one_erp`
- **Credentials**: Set `DB_PASSWORD` and `SECRET_KEY` in the environment before starting the application. Set `ADMIN_PASSWORD` to create the initial administrator account.
- **Tables Auto-Generated**:
  1. `companies`
  2. `fiscal_years`
  3. `fiscal_periods`
  4. `accounts`
  5. `journal_entries`
  6. `journal_entry_lines`
  7. `ap_invoices`
  8. `ar_invoices`
  9. `fixed_assets`
  10. `budgets`
  11. `gst_records`
  12. `users`

---

## ⚖️ Business Rules Implemented (Section 8)

1. **Company Code Uniqueness**: Rejects duplicate company codes with HTTP `409 Conflict`.
2. **Double-Entry Equilibrium**: Journal entries must satisfy `Total Debit == Total Credit`. Unbalanced vouchers are rejected with HTTP `422`.
3. **Period Open/Closed Guard**: Transactions can only be posted to **OPEN** financial periods. Closed periods reject postings with HTTP `400`.
4. **General Ledger Balances**: Posting a journal entry automatically updates the Account balance (Asset/Expense increases with Debit; Liability/Equity/Revenue increases with Credit).
5. **AP / AR Subledger Tracking**:
   - `Supplier Invoice` → `Payments` → `Remaining Balance`
   - `Customer Invoice` → `Collections` → `Remaining Due`
6. **Financial Reports**:
   - **Trial Balance**: Verifies Total Debits equal Total Credits.
   - **Profit & Loss**: Operating Revenue minus Operating Expenses = Net Profit/Loss.
   - **Balance Sheet**: Assets equal Liabilities plus Owner's Equity.

---

## 🚀 How to Run the Web Application

From the project root:

```powershell
python run.py
```

### URLs:
- 🌐 **Interactive Web Application**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- 📖 **OpenAPI / Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ❤️ **Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

Set `ADMIN_PASSWORD` in the environment before the first start to create the initial `admin` account. Choose a strong, unique password.

---

## 🧪 Running the Complete Platform Test Suite

```powershell
python backend/tests/test_full_platform.py
```
