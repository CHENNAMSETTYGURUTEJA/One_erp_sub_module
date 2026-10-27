import logging
import sys


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger("stackly_oneerp")


def mask_sensitive_data(data: dict) -> dict:
    """
    Sanitizes dictionary payloads by redacting sensitive fields
    (passwords, tokens, secrets) before logging, adhering to
    Section 10 of STACKLY Development Standard.
    """
    sensitive_keys = {"password", "token", "secret", "access_token", "credit_card", "authorization"}
    if not isinstance(data, dict):
        return data

    sanitized = {}
    for key, value in data.items():
        if any(s in key.lower() for s in sensitive_keys):
            sanitized[key] = "********"
        elif isinstance(value, dict):
            sanitized[key] = mask_sensitive_data(value)
        else:
            sanitized[key] = value
    return sanitized

