from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import pytest

from app.db.models import Analysis
from app.db.repository import (
    create_analysis,
    delete_analysis,
    get_analysis,
    list_analyses,
    to_out,
)


def analysis_data(**overrides):
    data = {
        "image_path": "uploads/meal.jpg",
        "label": "pizza",
        "confidence": 0.87,
        "uncertain": False,
        "top3": [
            {"label": "pizza", "score": 0.87},
            {"label": "calzone", "score": 0.08},
            {"label": "focaccia", "score": 0.03},
        ],
        "ingredients": ["dough", "tomato", "mozzarella"],
        "steps": ["Bake the dough", "Add toppings"],
        "created_at": datetime.now(UTC),
    }
    data.update(overrides)
    return data


def test_create_analysis_persists_row(db):
    created = create_analysis(db, analysis_data(uncertain=True))

    assert isinstance(created.id, UUID)
    assert created.uncertain is True
    assert created.created_at is not None

    fetched = db.get(Analysis, created.id)
    assert fetched is not None
    assert fetched.label == "pizza"
    assert fetched.confidence == 0.87
    assert fetched.top3[0] == {"label": "pizza", "score": 0.87}
    assert fetched.ingredients == ["dough", "tomato", "mozzarella"]


def test_create_analysis_applies_defaults(db):
    created = create_analysis(
        db,
        {
            "image_path": "uploads/soup.jpg",
            "label": "soup",
            "confidence": 0.5,
            "top3": [],
        },
    )

    assert created.uncertain is False
    assert created.ingredients == []
    assert created.steps == []
    assert created.created_at is not None


def test_get_analysis_returns_row(db):
    created = create_analysis(db, analysis_data())

    fetched = get_analysis(db, created.id)

    assert fetched is not None
    assert fetched.id == created.id


def test_get_analysis_missing_returns_none(db):
    assert get_analysis(db, uuid4()) is None


def test_list_analyses_orders_newest_and_paginates(db):
    base = datetime.now(UTC)
    oldest = create_analysis(
        db, analysis_data(label="oldest", created_at=base - timedelta(minutes=2))
    )
    middle = create_analysis(
        db, analysis_data(label="middle", created_at=base - timedelta(minutes=1))
    )
    newest = create_analysis(db, analysis_data(label="newest", created_at=base))

    items, total = list_analyses(db, limit=10, offset=0, order_by="newest")

    assert total == 3
    assert [item.id for item in items] == [newest.id, middle.id, oldest.id]

    page, page_total = list_analyses(db, limit=1, offset=1, order_by="newest")
    assert page_total == 3
    assert [item.id for item in page] == [middle.id]


def test_list_analyses_orders_by_confidence(db):
    create_analysis(db, analysis_data(label="low", confidence=0.2))
    create_analysis(db, analysis_data(label="high", confidence=0.93))
    create_analysis(db, analysis_data(label="mid", confidence=0.55))

    items, total = list_analyses(db, order_by="confidence")

    assert total == 3
    assert [item.label for item in items] == ["high", "mid", "low"]


def test_list_analyses_rejects_unknown_order(db):
    with pytest.raises(ValueError):
        list_analyses(db, order_by="oldest")


def test_delete_analysis_returns_deleted_row(db):
    created = create_analysis(db, analysis_data())

    deleted = delete_analysis(db, created.id)

    assert deleted is not None
    assert deleted.id == created.id
    assert get_analysis(db, created.id) is None
    assert delete_analysis(db, created.id) is None


def test_to_out_builds_public_shape(db):
    created = create_analysis(
        db, analysis_data(image_path="/app/uploads/nested/2026/meal.png")
    )

    out = to_out(created)

    assert out.id == created.id
    assert out.label == "pizza"
    assert out.confidence == created.confidence
    assert out.uncertain is False
    assert out.image_url == "/uploads/meal.png"
    assert out.ingredients == ["dough", "tomato", "mozzarella"]
    assert out.steps == ["Bake the dough", "Add toppings"]
    assert out.created_at == created.created_at
    assert [item.label for item in out.top3] == ["pizza", "calzone", "focaccia"]
    assert out.top3[0].score == 0.87
