"""
app/core/config.py
──────────────────
Central configuration loaded from environment variables / .env file.
Pydantic-settings validates every field at startup — if a required value
is missing the app will refuse to start, which is exactly what we want.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # ── OpenAI ────────────────────────────────────────────────────────────────
    openai_api_key: str

    # ── Database ──────────────────────────────────────────────────────────────
    database_url: str  # e.g. postgresql+asyncpg://user:pass@host/db

    # ── App ───────────────────────────────────────────────────────────────────
    app_env: str = "development"
    cors_origins: str = "http://localhost:3000"

    # ── RAG Tuning ────────────────────────────────────────────────────────────
    # How large each text chunk is (in characters). Larger = more context per
    # chunk, but less precise retrieval. 1000 chars ≈ 200-250 tokens.
    chunk_size: int = 1000

    # How many characters overlap between adjacent chunks.
    # Overlap prevents answers being split across chunk boundaries.
    chunk_overlap: int = 200

    # Number of chunks to retrieve from the vector DB per query.
    retrieval_top_k: int = 5

    # Which OpenAI model to use for embeddings.
    embedding_model: str = "text-embedding-3-small"

    # Which OpenAI model to use for chat completions.
    llm_model: str = "gpt-4o-mini"

    # Tell pydantic-settings to read from a .env file automatically.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache()  # singleton — settings are read once and reused everywhere
def get_settings() -> Settings:
    return Settings()
