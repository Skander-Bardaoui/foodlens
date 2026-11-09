from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+psycopg://foodlens:foodlens@localhost:5432/foodlens"

    hf_model_id: str = "nateraw/food"

    llm_provider: str = "openai"
    llm_api_key: SecretStr | None = None
    llm_model: str = "gpt-4o-mini"
    # Optional OpenAI-compatible endpoint (useful for local or self-hosted LLMs).
    llm_base_url: str | None = None

    cors_origins: str = "http://localhost:5173"

    max_upload_mb: int = 10
    upload_dir: str = "uploads"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def safe_database_url(self) -> str:
        return make_url(self.database_url).render_as_string(hide_password=True)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
