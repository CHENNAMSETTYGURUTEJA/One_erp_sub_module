class OneERPException(Exception):
    """Base exception for STACKLY OneERP."""
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class DuplicateEntityException(OneERPException):
    def __init__(self, message: str):
        super().__init__(message, status_code=409)


class EntityNotFoundException(OneERPException):
    def __init__(self, message: str):
        super().__init__(message, status_code=404)


class PeriodClosedException(OneERPException):
    def __init__(self, message: str = "Posting rejected: The financial period is closed."):
        super().__init__(message, status_code=400)


class UnbalancedJournalException(OneERPException):
    def __init__(self, debit_sum: float, credit_sum: float):
        message = (
            f"Journal Entry is unbalanced: Total Debits ({debit_sum:.2f}) "
            f"must equal Total Credits ({credit_sum:.2f})."
        )
        super().__init__(message, status_code=400)


class BusinessRuleException(OneERPException):
    def __init__(self, message: str):
        super().__init__(message, status_code=400)

