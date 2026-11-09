import pytest

pytest.importorskip("torch")
pytest.importorskip("torchvision")

from app.ml.regional import (  # noqa: E402
    build_top3,
    select_regional_candidate,
)
from app.schemas import Top3Item  # noqa: E402


def test_select_accepts_supported_regional_dish():
    chosen = select_regional_candidate(
        regional_scores={"couscous": 0.90, "baklava": 0.10},
        clip_scores={"couscous": 0.40},
        food101_clip_score=0.30,
        confuser_clip_score=0.20,
    )

    assert chosen == ("couscous", 0.40)


def test_select_rejects_when_food101_match_is_close():
    chosen = select_regional_candidate(
        regional_scores={"couscous": 0.90},
        clip_scores={"couscous": 0.40},
        food101_clip_score=0.399,
        confuser_clip_score=0.20,
    )

    assert chosen is None


def test_select_rejects_low_regional_model_score():
    chosen = select_regional_candidate(
        regional_scores={"couscous": 0.05},
        clip_scores={"couscous": 0.40},
        food101_clip_score=0.20,
        confuser_clip_score=0.10,
    )

    assert chosen is None


def test_select_rejects_when_confuser_is_within_margin():
    chosen = select_regional_candidate(
        regional_scores={"mloukhiya": 0.90},
        clip_scores={"mloukhiya": 0.40},
        food101_clip_score=0.20,
        confuser_clip_score=0.396,
    )

    assert chosen is None


def test_select_ignores_unsupported_regional_dishes():
    chosen = select_regional_candidate(
        regional_scores={"baklava": 0.95},
        clip_scores={"couscous": 0.40},
        food101_clip_score=0.20,
        confuser_clip_score=0.10,
    )

    assert chosen is None


def test_build_top3_normalizes_clip_scores_and_keeps_order():
    top3 = build_top3(
        chosen_label="Couscous",
        chosen_score=0.40,
        food101_top3=[
            Top3Item(label="Pizza", score=0.95),
            Top3Item(label="Bruschetta", score=0.03),
            Top3Item(label="Garlic bread", score=0.02),
        ],
        food101_clip_scores={"Pizza": 0.30, "Bruschetta": 0.20},
    )

    assert [item.label for item in top3] == ["Couscous", "Pizza", "Bruschetta"]
    assert [item.score for item in top3] == sorted(
        [item.score for item in top3], reverse=True
    )
    assert sum(item.score for item in top3) == pytest.approx(1.0)


def test_build_top3_reranks_when_food101_order_differs_from_clip():
    top3 = build_top3(
        chosen_label="Mloukhiya",
        chosen_score=0.40,
        food101_top3=[
            Top3Item(label="Creme brulee", score=0.50),
            Top3Item(label="Chicken curry", score=0.40),
            Top3Item(label="Gnocchi", score=0.10),
        ],
        food101_clip_scores={"Creme brulee": 0.20, "Chicken curry": 0.30},
    )

    assert [item.label for item in top3] == [
        "Mloukhiya",
        "Chicken curry",
        "Creme brulee",
    ]
    assert [item.score for item in top3] == sorted(
        [item.score for item in top3], reverse=True
    )
