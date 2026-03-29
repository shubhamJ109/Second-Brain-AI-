from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # ── Google Gemini ─────────────────────────────────────────────────────────
    gemini_api_key: str

    # ── Database ──────────────────────────────────────────────────────────────
    database_url: str

    # ── App ───────────────────────────────────────────────────────────────────
    app_env: str = "development"
    cors_origins: str = "http://localhost:3000"
    upload_dir: str = "uploads"

    # ── RAG Tuning ────────────────────────────────────────────────────────────
    chunk_size: int = 1000
    chunk_overlap: int = 200
    retrieval_top_k: int = 5
    embedding_model: str = "models/gemini-embedding-001"
    llm_model: str = "models/gemini-2.5-flash"
    embedding_batch_size: int = 1  # Ultimate stability mode: one chunk at a time

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache()
def get_settings() -> Settings:
    return Settings()