import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.schemas import ErrorBody, ErrorResponse

logger = logging.getLogger("foodlens.errors")

INVALID_IMAGE = "INVALID_IMAGE"
FILE_TOO_LARGE = "FILE_TOO_LARGE"
VALIDATION_ERROR = "VALIDATION_ERROR"
NOT_FOUND = "NOT_FOUND"
LLM_FAILURE = "LLM_FAILURE"
INTERNAL_ERROR = "INTERNAL_ERROR"

ERROR_STATUS_CODES: dict[str, int] = {
    INVALID_IMAGE: 400,
    FILE_TOO_LARGE: 413,
    VALIDATION_ERROR: 422,
    NOT_FOUND: 404,
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


def _error_response(code: str, message: str, status_code: int) -> JSONResponse:
    body = ErrorResponse(error=ErrorBody(code=code, message=message))
    return JSONResponse(status_code=status_code, content=body.model_dump())


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return _error_response(exc.code, exc.message, exc.status_code)


async def validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    details = "; ".join(
        f"{'.'.join(str(part) for part in error['loc'])}: {error['msg']}"
        for error in exc.errors()
    )
    return _error_response(VALIDATION_ERROR, details or "Request validation failed", 422)


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return _error_response(INTERNAL_ERROR, "Internal server error", 500)


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
