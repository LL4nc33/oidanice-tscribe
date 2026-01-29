"""Async SQLite database setup with SQLAlchemy.

WHY: SQLAlchemy async engine with aiosqlite allows non-blocking database
operations within FastAPI's async request handlers. SQLite chosen because
it requires zero additional infrastructure - the database is just a file.
For a transcription service with moderate concurrency this is sufficient.
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# WHY: echo=False in production to avoid log spam. The check_same_thread
# arg is SQLite-specific - needed because FastAPI serves from multiple threads
# but SQLite's default is single-thread only.
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    connect_args={"check_same_thread": False},
)

# WHY: expire_on_commit=False prevents lazy-load issues after commit
# in async context where the session might already be closed.
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """SQLAlchemy declarative base for all models.

    WHY: Single base class ensures all models share the same metadata
    and can be created/dropped together via Base.metadata.create_all().
    """

    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency that provides a database session.

    WHY: Dependency injection pattern ensures each request gets its own
    session and the session is properly closed after the request,
    even if an exception occurs (via async context manager).
    """
    async with async_session() as session:
        yield session


async def init_db():
    """Create all tables on startup.

    WHY: Auto-create tables at startup so the app works out of the box
    without manual migration steps. For a v0.0.1 this is simpler than
    Alembic migrations - we can add those when schema changes are needed.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
