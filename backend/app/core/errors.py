import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.logging import request_id_var
from app.schemas import ErrorBody, ErrorResponse

logger = logging.getLogger("foodlens.errors")

INVALID_IMAGE = "INVALID_IMAGE"
FILE_TOO_LARGE = "FILE_TOO_LARGE"
VALIDATION_ERROR = "VALIDATION_ERROR"
NOT_FOUND = "NOT_FOUND"
RATE_LIMITED = "RATE_LIMITED"
LLM_FAILURE = "LLM_FAILURE"
INTERNAL_ERROR = "INTERNAL_ERROR"

ERROR_STATUS_CODES: dict[str, int] = {
    INVALID_IMAGE: 400,
    FILE_TOO_LARGE: 413,
    VALIDATION_ERROR: 422,
    NOT_FOUND: 404,
    RATE_LIMITED: 429,
    LLM_FAILURE: 502,
    INTERNAL_ERROR: 500,
}


class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int | None = None) -> None:
        self.code = code
        self.message = message
        self.status_code = (
            status_code if status_code is not None else ERROR_STATUS_CODES.get(code, 500)
        )
        super().__init__(message)


def error_response(
    code: str,
    message: str,
    status_code: int,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    body = ErrorResponse(error=ErrorBody(code=code, message=message))
    return JSONResponse(
        status_code=status_code,
        content=body.model_dump(),
        headers=headers,
    )


def request_id_from(request: Request) -> str:
    return getattr(request.state, "request_id", request_id_var.get())


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return error_response(exc.code, exc.message, exc.status_code)


async def validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    details = "; ".join(
        f"{'.'.join(str(part) for part in error['loc'])}: {error['msg']}"
        for error in exc.errors()
    )
    return error_response(VALIDATION_ERROR, details or "Request validation failed", 422)


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = request_id_from(request)
    logger.exception(
        "Unhandled exception on %s %s",
        request.method,
        request.url.path,
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status": 500,
        },
    )
    return error_response(
        INTERNAL_ERROR,
        "Internal server error",
        500,
        headers={"X-Request-ID": request_id},
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
