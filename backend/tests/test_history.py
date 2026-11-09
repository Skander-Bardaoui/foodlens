from collections.abc import Iterator
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.db.models import Analysis
from app.db.repository import create_analysis
from app.db.session import get_db
from app.main import app


@pytest.fixture
def client(db_session) -> Iterator[TestClient]:
    app.dependency_overrides[get_db] = lambda: db_session
    yield TestClient(app)
    app.dependency_overrides.pop(get_db, None)


def make_analysis(db_session, label: str = "Pizza") -> Analysis:
    return create_analysis(
        db_session,
        {
            "label": label,
            "confidence": 0.91,
            "uncertain": False,
            "top3": [
                {"label": label, "score": 0.91},
                {"label": "Bruschetta", "score": 0.05},
                {"label": "Garlic bread", "score": 0.04},
            ],
            "ingredients": ["500 g dough", "200 g tomatoes"],
            "steps": ["Stretch the dough.", "Bake until golden."],
            "image_path": f"uploads/{label.lower()}.jpg",
        },
    )


def test_get_analysis_returns_persisted_record(client, db_session):
    created = make_analysis(db_session)

    response = client.get(f"/api/history/{created.id}")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == str(created.id)
    assert body["label"] == "Pizza"
    assert body["top3"][0] == {"label": "Pizza", "score": pytest.approx(0.91)}
    assert body["ingredients"] == ["500 g dough", "200 g tomatoes"]
    assert body["image_url"] == "/uploads/pizza.jpg"


def test_get_unknown_analysis_returns_404(client):
    response = client.get(f"/api/history/{uuid4()}")

    assert response.status_code == 404
    assert response.json() == {
        "error": {"code": "NOT_FOUND", "message": "Analysis not found"}
    }


def test_list_history_returns_analyses(client, db_session):
    first = make_analysis(db_session, "Pizza")
    second = make_analysis(db_session, "Sushi")

    response = client.get("/api/history")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    ids = {item["id"] for item in body["items"]}
    assert ids == {str(first.id), str(second.id)}


def test_delete_analysis_removes_record(client, db_session, tmp_path, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    created = make_analysis(db_session)
    Path(tmp_path, "pizza.jpg").write_bytes(b"image")

    response = client.delete(f"/api/history/{created.id}")

    assert response.status_code == 204
    assert db_session.get(Analysis, created.id) is None
    assert client.get(f"/api/history/{created.id}").status_code == 404


def test_delete_unknown_analysis_returns_404(client):
    response = client.delete(f"/api/history/{uuid4()}")

    assert response.status_code == 404
