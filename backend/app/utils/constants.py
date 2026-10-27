from enum import Enum


class AccountType(str, Enum):
    ASSET = "Asset"
    LIABILITY = "Liability"
    EQUITY = "Equity"
    REVENUE = "Revenue"
    EXPENSE = "Expense"


class PeriodStatus(str, Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"


class JournalStatus(str, Enum):
    DRAFT = "DRAFT"
    POSTED = "POSTED"
    CANCELLED = "CANCELLED"


class InvoiceStatus(str, Enum):
    UNPAID = "UNPAID"
    PARTIAL = "PARTIAL"
    PAID = "PAID"


class AssetStatus(str, Enum):
    ACTIVE = "ACTIVE"
    RETIRED = "RETIRED"
    DISPOSED = "DISPOSED"


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    FINANCE_MANAGER = "FINANCE_MANAGER"
    ACCOUNTANT = "ACCOUNTANT"
    AUDITOR = "AUDITOR"

