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
    """Create all tables on startup and migrate schema if needed.

    WHY: Auto-create tables at startup so the app works out of the box
    without manual migration steps. For a v0.0.1 this is simpler than
    Alembic migrations - we can add those when schema changes are needed.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # WHY: SQLAlchemy's create_all() only creates missing tables, not missing
    # columns. For existing databases we need to add new columns manually.
    # This is a lightweight alternative to Alembic for simple additions.
    await _migrate_add_columns()


async def _migrate_add_columns():
    """Add columns that may be missing from existing databases.

    WHY: When we add new nullable columns to models, existing SQLite databases
    won't have them. We check via PRAGMA and ALTER TABLE to add them safely.
    This runs on every startup but is a no-op when columns already exist.
    """
    import sqlalchemy

    async with engine.begin() as conn:
        # WHY: PRAGMA table_info returns column metadata for the table.
        # We check if 'source' column exists before attempting to add it.
        result = await conn.execute(sqlalchemy.text("PRAGMA table_info(jobs)"))
        columns = {row[1] for row in result.fetchall()}

        if "source" not in columns:
            await conn.execute(
                sqlalchemy.text("ALTER TABLE jobs ADD COLUMN source VARCHAR(20)")
            )
