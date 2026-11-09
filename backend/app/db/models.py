import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, Float, String, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    image_path: Mapped[str] = mapped_column(String)
    label: Mapped[str] = mapped_column(String, index=True)
    confidence: Mapped[float] = mapped_column(Float)
    uncertain: Mapped[bool] = mapped_column(Boolean, default=False)
    top3: Mapped[list[dict[str, Any]]] = mapped_column(JSONB)
    ingredients: Mapped[list[str]] = mapped_column(JSONB, default=list)
    steps: Mapped[list[str]] = mapped_column(JSONB, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
