"""Shared test fixtures for OidaNice TScribe backend tests.

Provides:
- In-memory async SQLite database (no file, no external DB needed)
- FastAPI TestClient with overridden DB dependency
- Mock Redis/RQ so tests run without a Redis server
- Segment factory for format converter tests
"""

import sys
from dataclasses import dataclass
from unittest.mock import MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# ---------------------------------------------------------------------------
# Mock heavy worker dependencies BEFORE any app imports touch them.
# faster-whisper is not installed in the test environment.
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class Segment:
    """Test-compatible Segment matching app.worker.transcribe.Segment."""

    start: float
    end: float
    text: str


# Create a fake transcribe module so `from app.worker.transcribe import Segment` works
# without faster-whisper being installed.
_fake_transcribe = MagicMock()
_fake_transcribe.Segment = Segment
sys.modules.setdefault("faster_whisper", MagicMock())
sys.modules.setdefault("app.worker.transcribe", _fake_transcribe)

# Mock Redis and RQ at module level before importing the app.
# The jobs router creates a Redis connection and RQ Queue at import time.
_mock_redis_class = MagicMock()
_mock_queue_instance = MagicMock()
_mock_queue_instance.enqueue = MagicMock(return_value=MagicMock(id="mock-rq-job-id"))

with patch("redis.Redis.from_url", return_value=MagicMock()):
    with patch("rq.Queue", return_value=_mock_queue_instance):
        from app.database import Base, get_db
        from app.main import create_app

# Re-export Segment so test modules can import from conftest
__all__ = ["Segment"]


# ---------------------------------------------------------------------------
# Database fixtures: in-memory async SQLite
# ---------------------------------------------------------------------------

TEST_DATABASE_URL = "sqlite+aiosqlite://"  # in-memory


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest_asyncio.fixture(scope="function")
async def async_db_session():
    """Yield a fresh async DB session backed by an in-memory SQLite database.

    Each test function gets its own database (tables created and dropped).
    """
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


# ---------------------------------------------------------------------------
# FastAPI test client
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture(scope="function")
async def client(async_db_session: AsyncSession):
    """Provide an httpx AsyncClient wired to the FastAPI app with test DB.

    Overrides the get_db dependency so all endpoints use the in-memory
    test database instead of the real one.
    """

    async def _override_get_db():
        yield async_db_session

    app = create_app()
    app.dependency_overrides[get_db] = _override_get_db

    # Patch the module-level queue in the jobs router to use our mock
    with patch("app.routes.jobs.queue", _mock_queue_instance):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
        ) as ac:
            yield ac

    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Segment helpers
# ---------------------------------------------------------------------------


@pytest.fixture
def sample_segments() -> list[Segment]:
    """A small list of segments for format conversion tests."""
    return [
        Segment(start=0.0, end=2.5, text="Hello world"),
        Segment(start=2.5, end=5.0, text="This is a test"),
        Segment(start=5.0, end=8.123, text="Third segment here"),
    ]


@pytest.fixture
def single_segment() -> list[Segment]:
    """A list with exactly one segment."""
    return [Segment(start=0.0, end=1.0, text="Only segment")]


@pytest.fixture
def empty_segments() -> list[Segment]:
    """An empty segment list."""
    return []
