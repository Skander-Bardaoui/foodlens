import json
import logging

from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.logging import JsonFormatter
from app.main import app


def test_request_id_is_generated_and_returned():
    response = TestClient(app).get("/api/health")

    assert response.status_code == 200
    assert response.headers["x-request-id"]


def test_request_id_header_is_echoed():
    response = TestClient(app).get(
        "/api/health",
        headers={"X-Request-ID": "deploy-check-123"},
    )

    assert response.headers["x-request-id"] == "deploy-check-123"


def test_request_completion_log_contains_structured_fields(caplog):
    with caplog.at_level(logging.INFO, logger="foodlens.request"):
        TestClient(app).get("/api/health")

    record = next(
        item for item in caplog.records if item.getMessage() == "request.completed"
    )
    assert record.request_id
    assert record.method == "GET"
    assert record.path == "/api/health"
    assert record.status == 200
    assert record.duration_ms >= 0


def test_json_formatter_emits_request_fields_and_traceback():
    record = logging.LogRecord(
        "foodlens.test",
        logging.ERROR,
        __file__,
        1,
        "boom",
        (),
        (ValueError, ValueError("details"), None),
    )
    record.request_id = "req-1"
    record.method = "POST"
    record.path = "/api/analyze"
    record.status = 500
    record.duration_ms = 12.5

    payload = json.loads(JsonFormatter().format(record))

    assert payload["level"] == "ERROR"
    assert payload["request_id"] == "req-1"
    assert payload["method"] == "POST"
    assert payload["path"] == "/api/analyze"
    assert payload["status"] == 500
    assert payload["duration_ms"] == 12.5
    assert "ValueError: details" in payload["exception"]


def test_cors_allows_configured_origin():
    origin = settings.cors_origin_list[0]

    response = TestClient(app).options(
        "/api/health",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin


def test_cors_rejects_unlisted_origin():
    response = TestClient(app).options(
        "/api/health",
        headers={
            "Origin": "https://not-allowed.example",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert "access-control-allow-origin" not in response.headers


def test_cors_origins_are_split_and_trimmed(monkeypatch):
    monkeypatch.setattr(
        settings,
        "cors_origins",
        " https://app.example.com , https://admin.example.com ",
    )

    assert settings.cors_origin_list == [
        "https://app.example.com",
        "https://admin.example.com",
    ]
