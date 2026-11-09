import io
from collections.abc import Iterator
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.api import analyze as analyze_module
from app.db.models import Analysis
from app.db.session import get_db
from app.main import app
from app.ml.recipe import LLMTimeoutError
from app.schemas import RecipeOut, Top3Item

CONFIDENT_PREDICTIONS = [
    Top3Item(label="Pizza", score=0.95),
    Top3Item(label="Bruschetta", score=0.03),
    Top3Item(label="Garlic bread", score=0.02),
]

UNCERTAIN_PREDICTIONS = [
    Top3Item(label="Pizza", score=0.30),
    Top3Item(label="Bruschetta", score=0.25),
    Top3Item(label="Greek salad", score=0.20),
]


class FakeClassifier:
    def __init__(self, predictions: list[Top3Item]) -> None:
        self.predictions = predictions

    def classify(self, image: Image.Image) -> list[Top3Item]:
        return self.predictions


def image_bytes(fmt: str = "PNG") -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (32, 32), (220, 70, 40)).save(buffer, format=fmt)
    return buffer.getvalue()


@pytest.fixture
def client(tmp_path, monkeypatch, db_session) -> Iterator[TestClient]:
    monkeypatch.setattr(analyze_module.settings, "upload_dir", str(tmp_path))
    app.dependency_overrides[get_db] = lambda: db_session
    yield TestClient(app)
    app.dependency_overrides.pop(get_db, None)
    if hasattr(app.state, "classifier"):
        del app.state.classifier


def post_image(client: TestClient, content: bytes = None, filename: str = "dish.png"):
    return client.post(
        "/api/analyze",
        files={"image": (filename, content if content is not None else image_bytes(), "image/png")},
    )


def test_confident_analysis_returns_recipe_and_persists(
    client, tmp_path, monkeypatch, db_session
):
    app.state.classifier = FakeClassifier(CONFIDENT_PREDICTIONS)
    seen_labels: list[str] = []

    def fake_generate_recipe(label: str) -> RecipeOut:
        seen_labels.append(label)
        return RecipeOut(
            ingredients=["500 g pizza dough", "200 g tomatoes"],
            steps=["Stretch the dough.", "Bake until golden."],
        )

    monkeypatch.setattr(analyze_module, "generate_recipe", fake_generate_recipe)

    response = post_image(client)

    assert response.status_code == 200
    body = response.json()
    assert body["label"] == "Pizza"
    assert body["confidence"] == pytest.approx(0.95)
    assert body["uncertain"] is False
    assert [item["label"] for item in body["top3"]] == [
        "Pizza",
        "Bruschetta",
        "Garlic bread",
    ]
    assert body["ingredients"] == ["500 g pizza dough", "200 g tomatoes"]
    assert body["steps"] == ["Stretch the dough.", "Bake until golden."]
    assert body["image_url"].startswith("/uploads/")
    assert (tmp_path / body["image_url"].rsplit("/", 1)[1]).is_file()
    assert body["id"]
    assert body["created_at"]
    assert seen_labels == ["Pizza"]

    record = db_session.get(Analysis, UUID(body["id"]))
    assert record is not None
    assert record.label == "Pizza"
    assert record.top3[0]["label"] == "Pizza"
    assert record.top3[0]["score"] == pytest.approx(0.95)


def test_low_confidence_skips_the_llm(client, monkeypatch):
    app.state.classifier = FakeClassifier(UNCERTAIN_PREDICTIONS)

    def fail_if_called(label: str) -> RecipeOut:
        raise AssertionError("generate_recipe must not be called when uncertain")

    monkeypatch.setattr(analyze_module, "generate_recipe", fail_if_called)

    response = post_image(client)

    assert response.status_code == 200
    body = response.json()
    assert body["uncertain"] is True
    assert body["confidence"] == pytest.approx(0.30)
    assert body["top3"][0]["label"] == "Pizza"
    assert body["ingredients"] == []
    assert body["steps"] == []


def test_invalid_image_returns_400_error_payload(client):
    app.state.classifier = FakeClassifier(CONFIDENT_PREDICTIONS)

    response = post_image(client, content=b"definitely not an image")

    assert response.status_code == 400
    assert response.json() == {
        "error": {
            "code": "INVALID_IMAGE",
            "message": "Could not read image file",
        }
    }


def test_oversized_image_returns_413_error_payload(client, monkeypatch):
    app.state.classifier = FakeClassifier(CONFIDENT_PREDICTIONS)
    monkeypatch.setattr(analyze_module.settings, "max_upload_mb", 0)

    response = post_image(client)

    assert response.status_code == 413
    assert response.json()["error"]["code"] == "IMAGE_TOO_LARGE"


def test_llm_failure_returns_502_error_payload(client, tmp_path, monkeypatch):
    app.state.classifier = FakeClassifier(CONFIDENT_PREDICTIONS)

    def failing_generate_recipe(label: str) -> RecipeOut:
        raise LLMTimeoutError("LLM request timed out")

    monkeypatch.setattr(analyze_module, "generate_recipe", failing_generate_recipe)

    response = post_image(client)

    assert response.status_code == 502
    assert response.json() == {
        "error": {
            "code": "LLM_FAILURE",
            "message": "Could not generate a recipe. Please try again.",
        }
    }
    assert list(tmp_path.iterdir()) == []
