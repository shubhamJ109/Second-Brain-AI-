"""
app/main.py
────────────
FastAPI application entry point.

This file:
  • Creates the FastAPI app
  • Registers middleware (CORS)
  • Registers all API routers
  • Creates database tables on startup
  • Exposes a health-check endpoint
"""

from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import engine, Base
from app.api import documents, chat

# Import models so SQLAlchemy knows about them when creating tables
from app.models import document  # noqa: F401

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Code that runs on startup (before 'yield') and shutdown (after 'yield').
    Here we create DB tables if they don't exist yet.

    In production you'd use Alembic migrations instead — but auto-create
    is fine for local development.
    """
    # Ensure the upload directory exists
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    print(f"✅ Upload directory ready: {settings.upload_dir}")

    async with engine.begin() as conn:
        # CREATE TABLE IF NOT EXISTS for all models registered with Base
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables ready")
    yield
    # Cleanup on shutdown (close connection pool)
    await engine.dispose()


app = FastAPI(
    title="Second Brain AI (Gemini Powered)",
    description="Backend API for Document Ingestion and RAG using Google Gemini models.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# CORS (Cross-Origin Resource Sharing) allows the Next.js frontend (port 3000)
# to call this API (port 8000) from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(documents.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["system"])
async def health_check():
    """Simple liveness probe — useful for Docker/K8s health checks."""
    return {"status": "ok", "service": "second-brain-ai"}
