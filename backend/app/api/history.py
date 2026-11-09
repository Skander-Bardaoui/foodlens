from pathlib import Path, PurePath
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import NOT_FOUND, AppError
from app.db.repository import delete_analysis, get_analysis, list_analyses, to_out
from app.db.session import get_db
from app.schemas import AnalysisList, AnalysisOut, ErrorResponse

# owned by Person 2
router = APIRouter(prefix="/api", tags=["history"])

NOT_FOUND_RESPONSE = {404: {"model": ErrorResponse, "description": "Analysis not found"}}
VALIDATION_RESPONSE = {422: {"model": ErrorResponse, "description": "Validation error"}}


@router.get(
    "/history",
    response_model=AnalysisList,
    summary="List past analyses",
    responses=VALIDATION_RESPONSE,
)
def list_history(
    limit: int = Query(20, ge=1, le=100, description="Maximum number of items to return"),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    sort: Literal["newest", "confidence"] = Query(
        "newest", description="Ordering of the results"
    ),
    db: Session = Depends(get_db),
) -> AnalysisList:
    items, total = list_analyses(db, limit=limit, offset=offset, order_by=sort)
    return AnalysisList(items=[to_out(item) for item in items], total=total)


@router.get(
    "/history/{analysis_id}",
    response_model=AnalysisOut,
    summary="Get one analysis",
    responses={**NOT_FOUND_RESPONSE, **VALIDATION_RESPONSE},
)
def get_history_item(
    analysis_id: UUID,
    db: Session = Depends(get_db),
) -> AnalysisOut:
    analysis = get_analysis(db, analysis_id)
    if analysis is None:
        raise AppError(NOT_FOUND, "Analysis not found", status.HTTP_404_NOT_FOUND)
    return to_out(analysis)


@router.delete(
    "/history/{analysis_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an analysis and its image",
    responses={**NOT_FOUND_RESPONSE, **VALIDATION_RESPONSE},
)
def delete_history_item(
    analysis_id: UUID,
    db: Session = Depends(get_db),
) -> Response:
    analysis = get_analysis(db, analysis_id)
    if analysis is None:
        raise AppError(NOT_FOUND, "Analysis not found", status.HTTP_404_NOT_FOUND)

    image_file = Path(settings.upload_dir) / PurePath(analysis.image_path).name
    delete_analysis(db, analysis_id)

    try:
        image_file.unlink()
    except FileNotFoundError:
        pass

    return Response(status_code=status.HTTP_204_NO_CONTENT)
