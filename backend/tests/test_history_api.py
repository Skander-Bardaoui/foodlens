from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.db.repository import create_analysis, get_analysis
from app.db.session import get_db
from app.main import app

ANALYSIS_FIELDS = {
    "id",
    "label",
    "confidence",
    "uncertain",
    "top3",
    "ingredients",
    "steps",
    "image_url",
    "created_at",
}


@pytest.fixture()
def uploads_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    return tmp_path


@pytest.fixture()
def client(db, uploads_dir):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_db, None)


def make_analysis(db, uploads_dir, **overrides):
    image = uploads_dir / f"meal_{uuid4().hex}.jpg"
    image.write_bytes(b"fake image bytes")

    data = {
        "image_path": str(image),
        "label": "pizza",
        "confidence": 0.9,
        "uncertain": False,
        "top3": [{"label": "pizza", "score": 0.9}],
        "ingredients": ["dough", "tomato"],
        "steps": ["Bake"],
        "created_at": datetime.now(UTC),
    }
    data.update(overrides)
    return create_analysis(db, data), image


def test_list_history_returns_analysis_list(client, db, uploads_dir):
    for label in ["pizza", "sushi", "ramen"]:
        make_analysis(db, uploads_dir, label=label)

    response = client.get("/api/history")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 3
    assert len(body["items"]) == 3
    assert set(body["items"][0]) == ANALYSIS_FIELDS
    assert body["items"][0]["image_url"].startswith("/uploads/")


def test_list_history_paginates_newest_first(client, db, uploads_dir):
    base = datetime.now(UTC)
    for index in range(5):
        make_analysis(
            db,
            uploads_dir,
            label=f"dish-{index}",
            created_at=base + timedelta(minutes=index),
        )

    response = client.get("/api/history", params={"limit": 2, "offset": 2})

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 5
    assert [item["label"] for item in body["items"]] == ["dish-2", "dish-1"]


def test_list_history_sorts_by_confidence(client, db, uploads_dir):
    make_analysis(db, uploads_dir, label="low", confidence=0.4)
    make_analysis(db, uploads_dir, label="high", confidence=0.95)
    make_analysis(db, uploads_dir, label="mid", confidence=0.7)

    response = client.get("/api/history", params={"sort": "confidence"})

    assert response.status_code == 200
    assert [item["label"] for item in response.json()["items"]] == [
        "high",
        "mid",
        "low",
    ]


@pytest.mark.parametrize(
    "params",
    [{"limit": 0}, {"limit": 101}, {"offset": -1}, {"sort": "oldest"}],
)
def test_list_history_rejects_invalid_query(client, params):
    response = client.get("/api/history", params=params)

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_get_history_item(client, db, uploads_dir):
    analysis, image = make_analysis(db, uploads_dir, label="sushi")

    response = client.get(f"/api/history/{analysis.id}")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == str(analysis.id)
    assert body["label"] == "sushi"
    assert body["image_url"] == f"/uploads/{image.name}"
    assert body["top3"] == [{"label": "pizza", "score": 0.9}]


def test_get_missing_analysis_returns_404(client):
    response = client.get(f"/api/history/{uuid4()}")

    assert response.status_code == 404
    assert response.json() == {
        "error": {"code": "NOT_FOUND", "message": "Analysis not found"}
    }


def test_invalid_uuid_returns_422(client):
    response = client.get("/api/history/not-a-uuid")

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_delete_removes_row_and_file(client, db, uploads_dir):
    analysis, image = make_analysis(db, uploads_dir)
    assert image.exists()

    response = client.delete(f"/api/history/{analysis.id}")

    assert response.status_code == 204
    assert response.content == b""
    assert get_analysis(db, analysis.id) is None
    assert not image.exists()

    again = client.delete(f"/api/history/{analysis.id}")
    assert again.status_code == 404
    assert again.json()["error"]["code"] == "NOT_FOUND"


def test_delete_tolerates_missing_image(client, db, uploads_dir):
    analysis, image = make_analysis(db, uploads_dir)
    image.unlink()

    response = client.delete(f"/api/history/{analysis.id}")

    assert response.status_code == 204
    assert get_analysis(db, analysis.id) is None
