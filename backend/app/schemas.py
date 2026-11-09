from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str


class Top3Item(BaseModel):
    label: str
    score: float


class RecipeOut(BaseModel):
    ingredients: list[str]
    steps: list[str]


class AnalysisOut(BaseModel):
    id: UUID
    label: str
    confidence: float = Field(ge=0, le=1)
    uncertain: bool
    top3: list[Top3Item]
    ingredients: list[str]
    steps: list[str]
    image_url: str
    created_at: datetime


class AnalysisList(BaseModel):
    items: list[AnalysisOut]
    total: int


class ErrorBody(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorBody
