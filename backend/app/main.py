import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.analyze import router as analyze_router
from app.api.history import router as history_router
from app.api.routes import router as api_router
from app.core.config import settings
from app.db.session import engine
from app.schemas import HealthResponse

logger = logging.getLogger("foodlens")

DB_CONNECT_ATTEMPTS = 10
DB_CONNECT_DELAY_SECONDS = 2


@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.basicConfig(
        level=logging.INFO,
        format="%(levelname)s [%(name)s] %(message)s",
    )
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

    yield

    engine.dispose()


app = FastAPI(title="FoodLens API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")
app.include_router(analyze_router, prefix="/api")
app.include_router(history_router, prefix="/api")


@app.get("/api/health", response_model=HealthResponse, tags=["health"])
def health() -> HealthResponse:
    return HealthResponse(status="ok")
