from functools import lru_cache

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",  # don't raise on unknown env vars
    )

    # ── Project ───────────────────────────────────────────────────────────────
    PROJECT_NAME: str = "ATS Friendly — AI Career Agent"
    VERSION: str = "1.0.0"

    # ── Security / JWT ────────────────────────────────────────────────────────
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── PostgreSQL ────────────────────────────────────────────────────────────
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str
    DB_HOST: str
    DB_PORT: int = 5432

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        """Async URL — used by SQLAlchemy engine and FastAPI endpoints."""
        return (
            f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @computed_field
    @property
    def SYNC_DATABASE_URL(self) -> str:
        """Sync URL — used by Alembic migrations and Celery task sessions."""
        return (
            f"postgresql+psycopg2://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://redis:6379/0"

    # ── Qdrant ────────────────────────────────────────────────────────────────
    QDRANT_URL: str = "http://qdrant:6333"
    QDRANT_API_KEY: str = ""

    # ── LLM Providers ────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    TAVILY_API_KEY: str = ""

    # ── CORS ─────────────────────────────────────────────────────────────────
    # Must be a JSON array in .env — pydantic-settings v2 parses list fields
    # as JSON before any validator runs, so use: ["http://localhost:3000"]
    CORS_ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()
