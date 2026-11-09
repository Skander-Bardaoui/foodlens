from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


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
    confidence: float
    uncertain: bool
    top3: list[Top3Item]
    ingredients: list[str]
    steps: list[str]
    image_url: str
    created_at: datetime


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorDetail
