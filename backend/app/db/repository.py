from collections.abc import Mapping
from pathlib import PurePath
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Analysis
from app.schemas import AnalysisOut

ORDER_BY_OPTIONS = {
    "newest": (Analysis.created_at.desc(),),
    "confidence": (Analysis.confidence.desc(),),
}


def create_analysis(db: Session, data: Mapping[str, Any]) -> Analysis:
    analysis = Analysis(**data)
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


def get_analysis(db: Session, analysis_id: UUID) -> Analysis | None:
    return db.get(Analysis, analysis_id)


def list_analyses(
    db: Session,
    limit: int = 20,
    offset: int = 0,
    order_by: str = "newest",
) -> tuple[list[Analysis], int]:
    if order_by not in ORDER_BY_OPTIONS:
        raise ValueError(f"Unsupported order_by: {order_by!r}")

    total = db.scalar(select(func.count()).select_from(Analysis)) or 0
    items = list(
        db.scalars(
            select(Analysis)
            .order_by(*ORDER_BY_OPTIONS[order_by])
            .offset(offset)
            .limit(limit)
        )
    )
    return items, total


def delete_analysis(db: Session, analysis_id: UUID) -> Analysis | None:
    analysis = db.get(Analysis, analysis_id)
    if analysis is None:
        return None

    db.delete(analysis)
    db.commit()
    return analysis


def to_out(analysis: Analysis) -> AnalysisOut:
    return AnalysisOut(
        id=analysis.id,
        label=analysis.label,
        confidence=analysis.confidence,
        uncertain=analysis.uncertain,
        top3=analysis.top3,
        ingredients=analysis.ingredients,
        steps=analysis.steps,
        image_url=f"/uploads/{PurePath(analysis.image_path).name}",
        created_at=analysis.created_at,
    )
