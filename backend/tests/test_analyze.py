import io
import logging
from collections.abc import Iterator
from dataclasses import dataclass
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


class ExplodingClassifier:
    def classify(self, image: Image.Image) -> list[Top3Item]:
        raise RuntimeError("sensitive classifier detail")


@dataclass
class FakeRegionalPrediction:
    label: str
    confidence: float
    uncertain: bool
    top3: list[Top3Item]


class FakeRegionalRecognizer:
    def __init__(self, prediction: FakeRegionalPrediction) -> None:
        self.prediction = prediction

    def recognize(
        self, image: Image.Image, food101_top3: list[Top3Item]
    ) -> FakeRegionalPrediction:
        return self.prediction


class ExplodingRegionalRecognizer:
    def recognize(
        self, image: Image.Image, food101_top3: list[Top3Item]
    ) -> FakeRegionalPrediction:
        raise RuntimeError("regional model unavailable")


def image_bytes(fmt: str = "PNG") -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (32, 32), (220, 70, 40)).save(buffer, format=fmt)
    return buffer.getvalue()


@pytest.fixture
def client(tmp_path, monkeypatch, db_session) -> Iterator[TestClient]:
    monkeypatch.setattr(analyze_module.settings, "upload_dir", str(tmp_path))
    app.dependency_overrides[get_db] = lambda: db_session
    for state_name in ("classifier", "regional"):
        if hasattr(app.state, state_name):
            delattr(app.state, state_name)
    yield TestClient(app)
    app.dependency_overrides.pop(get_db, None)
    for state_name in ("classifier", "regional"):
        if hasattr(app.state, state_name):
            delattr(app.state, state_name)


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


def test_regional_prediction_replaces_food101_label(
    client, monkeypatch, db_session
):
    app.state.classifier = FakeClassifier(CONFIDENT_PREDICTIONS)
    app.state.regional = FakeRegionalRecognizer(
        FakeRegionalPrediction(
            label="Couscous",
            confidence=0.91,
            uncertain=False,
            top3=[
                Top3Item(label="Couscous", score=0.91),
                Top3Item(label="Lablabi", score=0.06),
                Top3Item(label="Salade mechouia", score=0.03),
            ],
        )
    )
    seen_labels: list[str] = []

    def fake_generate_recipe(label: str) -> RecipeOut:
        seen_labels.append(label)
        return RecipeOut(
            ingredients=["500 g couscous", "2 carrots"],
            steps=["Steam the couscous.", "Add the stew."],
        )

    monkeypatch.setattr(analyze_module, "generate_recipe", fake_generate_recipe)

    response = post_image(client)

    assert response.status_code == 200
    body = response.json()
    assert body["label"] == "Couscous"
    assert body["confidence"] == pytest.approx(0.91)
    assert body["uncertain"] is False
    assert [item["label"] for item in body["top3"]] == [
        "Couscous",
        "Lablabi",
        "Salade mechouia",
    ]
    assert seen_labels == ["Couscous"]

    record = db_session.get(Analysis, UUID(body["id"]))
    assert record is not None
    assert record.label == "Couscous"


def test_regional_failure_falls_back_to_food101(client, monkeypatch, caplog):
    app.state.classifier = FakeClassifier(CONFIDENT_PREDICTIONS)
    app.state.regional = ExplodingRegionalRecognizer()

    def fake_generate_recipe(label: str) -> RecipeOut:
        return RecipeOut(ingredients=["dough"], steps=["Bake."])

    monkeypatch.setattr(analyze_module, "generate_recipe", fake_generate_recipe)

    with caplog.at_level(logging.ERROR):
        response = post_image(client)

    assert response.status_code == 200
    assert response.json()["label"] == "Pizza"
    assert "Regional recognition failed" in caplog.text


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


def test_unexpected_error_is_logged_and_hidden(client, caplog):
    app.state.classifier = ExplodingClassifier()

    with caplog.at_level(logging.ERROR):
        response = post_image(client)

    assert response.status_code == 500
    assert response.json() == {
        "error": {
            "code": "INTERNAL_ERROR",
            "message": "Internal server error",
        }
    }
    assert response.headers["x-request-id"]
    assert "sensitive classifier detail" not in response.text

    failure = next(record for record in caplog.records if record.exc_info)
    assert failure.request_id == response.headers["x-request-id"]
    assert "sensitive classifier detail" in str(failure.exc_info[1])


def test_request_body_limit_returns_413(client, monkeypatch):
    monkeypatch.setattr(analyze_module.settings, "max_upload_mb", 0)

    response = post_image(client, content=b"x" * (100 * 1024))

    assert response.status_code == 413
    assert response.json()["error"]["code"] == "FILE_TOO_LARGE"
    assert response.headers["x-request-id"]


def test_analyze_rate_limit_returns_429(client, monkeypatch):
    monkeypatch.setattr(analyze_module.settings, "analyze_rate_limit_per_minute", 2)

    first = post_image(client, content=b"not an image")
    second = post_image(client, content=b"not an image")
    limited = post_image(client, content=b"not an image")

    assert first.status_code == 400
    assert second.status_code == 400
    assert limited.status_code == 429
    assert limited.json() == {
        "error": {
            "code": "RATE_LIMITED",
            "message": "Too many analysis requests. Please try again later.",
        }
    }
    assert int(limited.headers["retry-after"]) >= 1
    assert limited.headers["x-ratelimit-limit"] == "2"
