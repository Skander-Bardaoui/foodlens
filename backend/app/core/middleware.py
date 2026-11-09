import logging
import math
import re
from collections import deque
from time import monotonic, perf_counter
from uuid import uuid4

from starlette.datastructures import Headers, MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.config import settings
from app.core.errors import (
    FILE_TOO_LARGE,
    INTERNAL_ERROR,
    RATE_LIMITED,
    error_response,
)
from app.core.logging import request_id_var

logger = logging.getLogger("foodlens.request")

REQUEST_ID_PATTERN = re.compile(r"[A-Za-z0-9._-]{1,128}")
UPLOAD_OVERHEAD_BYTES = 64 * 1024
RATE_LIMIT_WINDOW_SECONDS = 60.0
ANALYZE_PATH = "/api/analyze"


def _request_id(scope: Scope) -> str:
    candidate = Headers(scope=scope).get("x-request-id", "").strip()
    if REQUEST_ID_PATTERN.fullmatch(candidate):
        return candidate
    return uuid4().hex


class RequestContextMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id = _request_id(scope)
        scope.setdefault("state", {})["request_id"] = request_id
        token = request_id_var.set(request_id)

        method = scope.get("method", "")
        path = scope.get("path", "")
        started_at = perf_counter()
        status_code = 500
        response_started = False

        async def send_with_request_id(message: Message) -> None:
            nonlocal status_code, response_started
            if message["type"] == "http.response.start":
                status_code = message["status"]
                response_started = True
                MutableHeaders(scope=message)["X-Request-ID"] = request_id
            await send(message)

        try:
            await self.app(scope, receive, send_with_request_id)
        except Exception:
            duration_ms = round((perf_counter() - started_at) * 1000, 2)
            logger.exception(
                "request.failed",
                extra={
                    "request_id": request_id,
                    "method": method,
                    "path": path,
                    "status": 500,
                    "duration_ms": duration_ms,
                },
            )
            if response_started:
                raise

            response = error_response(
                INTERNAL_ERROR,
                "Internal server error",
                500,
                headers={"X-Request-ID": request_id},
            )
            await response(scope, receive, send_with_request_id)
        else:
            logger.info(
                "request.completed",
                extra={
                    "request_id": request_id,
                    "method": method,
                    "path": path,
                    "status": status_code,
                    "duration_ms": round((perf_counter() - started_at) * 1000, 2),
                },
            )
        finally:
            request_id_var.reset(token)


class RequestBodyLimitMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        max_bytes = settings.max_upload_mb * 1024 * 1024 + UPLOAD_OVERHEAD_BYTES
        content_length = Headers(scope=scope).get("content-length")
        if content_length is not None:
            try:
                if int(content_length) > max_bytes:
                    await self._reject(scope, receive, send)
                    return
            except ValueError:
                pass

        messages: list[Message] = []
        total_bytes = 0
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            if message["type"] != "http.request":
                continue

            total_bytes += len(message.get("body", b""))
            if total_bytes > max_bytes:
                await self._reject(scope, receive, send)
                return

            messages.append(message)
            if not message.get("more_body", False):
                break

        index = 0

        async def replay_receive() -> Message:
            nonlocal index
            if index < len(messages):
                message = messages[index]
                index += 1
                return message
            return await receive()

        await self.app(scope, replay_receive, send)

    async def _reject(self, scope: Scope, receive: Receive, send: Send) -> None:
        response = error_response(
            FILE_TOO_LARGE,
            f"Request body exceeds the {settings.max_upload_mb} MB upload limit",
            413,
        )
        await response(scope, receive, send)


class SlidingWindowRateLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = {}

    def hit(
        self,
        key: str,
        limit: int,
        window_seconds: float = RATE_LIMIT_WINDOW_SECONDS,
    ) -> float | None:
        if limit <= 0:
            return None

        now = monotonic()
        hits = self._hits.setdefault(key, deque())
        while hits and hits[0] <= now - window_seconds:
            hits.popleft()

        if len(hits) >= limit:
            return max(0.0, hits[0] + window_seconds - now)

        hits.append(now)
        return None

    def reset(self) -> None:
        self._hits.clear()


analyze_rate_limiter = SlidingWindowRateLimiter()


class AnalyzeRateLimitMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if (
            scope["type"] != "http"
            or scope.get("method") != "POST"
            or scope.get("path", "").rstrip("/") != ANALYZE_PATH
        ):
            await self.app(scope, receive, send)
            return

        client = scope.get("client")
        client_ip = client[0] if client else "unknown"
        retry_after = analyze_rate_limiter.hit(
            client_ip,
            settings.analyze_rate_limit_per_minute,
        )
        if retry_after is None:
            await self.app(scope, receive, send)
            return

        response = error_response(
            RATE_LIMITED,
            "Too many analysis requests. Please try again later.",
            429,
            headers={
                "Retry-After": str(max(1, math.ceil(retry_after))),
                "X-RateLimit-Limit": str(settings.analyze_rate_limit_per_minute),
            },
        )
        await response(scope, receive, send)
