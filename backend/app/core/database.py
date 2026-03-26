"""
app/core/database.py
────────────────────
Async SQLAlchemy engine and session factory.

Why async?  FastAPI is an async framework.  Using an async DB driver
(asyncpg) means DB queries never block the event loop, so the server
can handle many requests concurrently without spinning up threads.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings

settings = get_settings()

# ── Engine ────────────────────────────────────────────────────────────────────
# echo=True logs every SQL statement — useful in development, disable in prod.
engine = create_async_engine(
    settings.database_url,
    echo=(settings.app_env == "development"),
    pool_pre_ping=True,   # verify connections are alive before using them
    pool_size=10,
    max_overflow=20,
)

# ── Session factory ───────────────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # keep objects usable after commit
)


# ── Base class for all ORM models ─────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ── FastAPI dependency ────────────────────────────────────────────────────────
async def get_db() -> AsyncSession:
    """
    Yields a database session for the duration of a request.
    The session is automatically closed (and rolled back on error)
    when the request finishes — thanks to Python's 'async with' context manager.

    Usage in a route:
        async def my_route(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
