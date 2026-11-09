from io import BytesIO
from types import SimpleNamespace

import pytest
from PIL import Image

torch = pytest.importorskip("torch")

from app.ml import classifier as classifier_module  # noqa: E402
from app.ml.classifier import ImageClassifier  # noqa: E402
from app.schemas import Top3Item  # noqa: E402


def generated_image_bytes(fmt: str = "PNG") -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (64, 64), (200, 60, 40)).save(buffer, format=fmt)
    return buffer.getvalue()


class FakeProcessor:
    @classmethod
    def from_pretrained(cls, model_id: str) -> "FakeProcessor":
        return cls()

    def __call__(self, images, return_tensors: str) -> dict:
        return {"pixel_values": torch.zeros(1, 3, 8, 8)}


class FakeModel:
    config = SimpleNamespace(
        id2label={0: "pizza", 1: "sushi", 2: "hamburger", 3: "soup"}
    )

    def __init__(self) -> None:
        self.training = True

    @classmethod
    def from_pretrained(cls, model_id: str) -> "FakeModel":
        return cls()

    def to(self, device: str) -> "FakeModel":
        return self

    def eval(self) -> "FakeModel":
        self.training = False
        return self

    def __call__(self, **kwargs) -> SimpleNamespace:
        return SimpleNamespace(logits=torch.tensor([[0.1, 1.0, 2.0, 0.5]]))


@pytest.fixture
def classifier(monkeypatch) -> ImageClassifier:
    monkeypatch.setattr(classifier_module, "AutoImageProcessor", FakeProcessor)
    monkeypatch.setattr(classifier_module, "AutoModelForImageClassification", FakeModel)
    return ImageClassifier()


def test_classify_returns_top_three_with_clean_labels(classifier):
    image = Image.open(BytesIO(generated_image_bytes())).convert("RGB")

    predictions = classifier.classify(image)

    assert [item.label for item in predictions] == ["Hamburger", "Sushi", "Soup"]
    assert all(isinstance(item, Top3Item) for item in predictions)


def test_classify_scores_are_softmax_probabilities_in_descending_order(classifier):
    image = Image.open(BytesIO(generated_image_bytes())).convert("RGB")

    predictions = classifier.classify(image)

    scores = [item.score for item in predictions]
    assert all(0.0 <= score <= 1.0 for score in scores)
    assert scores == sorted(scores, reverse=True)
    assert sum(scores) < 1.0


def test_model_is_put_in_eval_mode(classifier):
    assert classifier.model.training is False


def test_labels_are_cleaned_for_prompting(classifier):
    assert classifier.labels == ["Pizza", "Sushi", "Hamburger", "Soup"]
