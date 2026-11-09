from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Analysis
from app.schemas import AnalysisOut, Top3Item


def create_analysis(
    db: Session,
    *,
    label: str,
    confidence: float,
    uncertain: bool,
    top3: list[Top3Item],
    ingredients: list[str],
    steps: list[str],
    image_url: str,
) -> AnalysisOut:
    record = Analysis(
        label=label,
        confidence=confidence,
        uncertain=uncertain,
        top3=[item.model_dump() for item in top3],
        ingredients=ingredients,
        steps=steps,
        image_url=image_url,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _to_schema(record)


def get_analysis(db: Session, analysis_id: UUID) -> AnalysisOut | None:
    record = db.get(Analysis, analysis_id)
    return _to_schema(record) if record is not None else None


def list_analyses(db: Session, *, limit: int = 20) -> list[AnalysisOut]:
    records = db.scalars(
        select(Analysis).order_by(Analysis.created_at.desc()).limit(limit)
    ).all()
    return [_to_schema(record) for record in records]


def delete_analysis(db: Session, analysis_id: UUID) -> bool:
    record = db.get(Analysis, analysis_id)
    if record is None:
        return False

    db.delete(record)
    db.commit()
    return True


def _to_schema(record: Analysis) -> AnalysisOut:
    return AnalysisOut(
        id=record.id,
        label=record.label,
        confidence=record.confidence,
        uncertain=record.uncertain,
        top3=[Top3Item.model_validate(item) for item in record.top3],
        ingredients=record.ingredients,
        steps=record.steps,
        image_url=record.image_url,
        created_at=record.created_at,
    )
