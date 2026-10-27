from typing import Any, Optional, List, Dict
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    errors: Optional[List[Dict[str, Any]]] = None


def success_response(message: str, data: Any = None, status_code: int = 200) -> JSONResponse:
    """Returns a standardized JSON response for successful API executions."""
    return JSONResponse(
        status_code=status_code,
        content={
            "success": True,
            "message": message,
            "data": data,
        },
    )


def error_response(
    message: str,
    errors: Optional[List[Dict[str, Any]]] = None,
    status_code: int = 400,
    data: Any = None,
) -> JSONResponse:
    """Returns a standardized JSON response for errors and validation failures."""
    content: Dict[str, Any] = {
        "success": False,
        "message": message,
        "data": data,
    }
    if errors is not None:
        content["errors"] = errors

    return JSONResponse(status_code=status_code, content=content)

