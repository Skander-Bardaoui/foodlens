from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import JSON, Boolean, DateTime, Float, String, Uuid
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid4
    )
    label: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    uncertain: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    top3: Mapped[list[dict[str, object]]] = mapped_column(JSON, nullable=False)
    ingredients: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    steps: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    image_url: Mapped[str] = mapped_column(String(512), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
