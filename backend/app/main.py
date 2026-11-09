import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api.analyze import router as analyze_router
from app.api.history import router as history_router
from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging
from app.core.middleware import (
    AnalyzeRateLimitMiddleware,
    RequestBodyLimitMiddleware,
    RequestContextMiddleware,
)
from app.db.session import engine
from app.ml.classifier import ImageClassifier
from app.schemas import HealthResponse

logger = logging.getLogger("foodlens")

DB_CONNECT_ATTEMPTS = 10
DB_CONNECT_DELAY_SECONDS = 2


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    for attempt in range(1, DB_CONNECT_ATTEMPTS + 1):
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            logger.info("Connected to PostgreSQL at %s", settings.safe_database_url)
            break
        except Exception as exc:
            logger.warning(
                "PostgreSQL not ready (attempt %d/%d): %s",
                attempt,
                DB_CONNECT_ATTEMPTS,
                exc,
            )
            if attempt == DB_CONNECT_ATTEMPTS:
                logger.error("Giving up on the database; API will start without it")
            else:
                await asyncio.sleep(DB_CONNECT_DELAY_SECONDS)

    logger.info("Loading image classifier %s", settings.hf_model_id)
    app.state.classifier = ImageClassifier()
    logger.info("Image classifier ready")

    app.state.regional = None
    if settings.regional_enabled:
        try:
            from app.ml.regional import RegionalRecognizer

            app.state.regional = RegionalRecognizer(app.state.classifier.labels)
        except Exception:
            logger.exception(
                "Regional dish recognizer failed to load; using Food-101 only"
            )

    yield

    engine.dispose()


app = FastAPI(title="FoodLens API", version="0.1.0", lifespan=lifespan)

app.add_middleware(RequestBodyLimitMiddleware)
app.add_middleware(AnalyzeRateLimitMiddleware)
app.add_middleware(RequestContextMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

app.include_router(analyze_router)
app.include_router(history_router)

register_exception_handlers(app)


@app.get("/api/health", response_model=HealthResponse, tags=["health"])
def health() -> HealthResponse:
    return HealthResponse(status="ok")
