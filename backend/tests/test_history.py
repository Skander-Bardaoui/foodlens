from collections.abc import Iterator
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.db.models import Analysis
from app.db.repository import create_analysis
from app.db.session import get_db
from app.main import app
from app.schemas import AnalysisOut, Top3Item


@pytest.fixture
def client(db_session) -> Iterator[TestClient]:
    app.dependency_overrides[get_db] = lambda: db_session
    yield TestClient(app)
    app.dependency_overrides.pop(get_db, None)


def make_analysis(db_session, label: str = "Pizza") -> AnalysisOut:
    return create_analysis(
        db_session,
        label=label,
        confidence=0.91,
        uncertain=False,
        top3=[
            Top3Item(label=label, score=0.91),
            Top3Item(label="Bruschetta", score=0.05),
            Top3Item(label="Garlic bread", score=0.04),
        ],
        ingredients=["500 g dough", "200 g tomatoes"],
        steps=["Stretch the dough.", "Bake until golden."],
        image_url=f"/uploads/{label.lower()}.jpg",
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
    ids = {item["id"] for item in response.json()}
    assert ids == {str(first.id), str(second.id)}


def test_delete_analysis_removes_record(client, db_session):
    created = make_analysis(db_session)

    response = client.delete(f"/api/history/{created.id}")

    assert response.status_code == 204
    assert db_session.get(Analysis, created.id) is None
    assert client.get(f"/api/history/{created.id}").status_code == 404


def test_delete_unknown_analysis_returns_404(client):
    response = client.delete(f"/api/history/{uuid4()}")

    assert response.status_code == 404
