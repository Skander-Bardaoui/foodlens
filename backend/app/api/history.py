from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.db.repository import delete_analysis, get_analysis, list_analyses
from app.db.session import get_db
from app.schemas import AnalysisOut, ErrorResponse

router = APIRouter(prefix="/history", tags=["history"])


@router.get(
    "",
    response_model=list[AnalysisOut],
    summary="List recent analyses",
)
def list_history(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[AnalysisOut]:
    return list_analyses(db, limit=limit)


@router.get(
    "/{analysis_id}",
    response_model=AnalysisOut,
    summary="Get one analysis",
    responses={404: {"model": ErrorResponse, "description": "Analysis not found"}},
)
def read_analysis(analysis_id: UUID, db: Session = Depends(get_db)):
    analysis = get_analysis(db, analysis_id)
    if analysis is None:
        return _not_found()
    return analysis


@router.delete(
    "/{analysis_id}",
    status_code=204,
    summary="Delete one analysis",
    responses={
        204: {"description": "Analysis deleted"},
        404: {"model": ErrorResponse, "description": "Analysis not found"},
    },
)
def remove_analysis(analysis_id: UUID, db: Session = Depends(get_db)):
    if not delete_analysis(db, analysis_id):
        return _not_found()
    return Response(status_code=204)


def _not_found() -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={
            "error": {
                "code": "NOT_FOUND",
                "message": "Analysis not found",
            }
        },
    )
