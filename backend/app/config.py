"""Application configuration via environment variables.

WHY: Pydantic Settings provides type-safe config with automatic env var
parsing, .env file support, and validation at startup. This catches
misconfiguration early instead of at runtime when a feature is first used.
"""

from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Central configuration for all backend services.

    WHY: Single source of truth for configuration avoids scattered os.getenv()
    calls and makes it easy to see all configurable parameters at a glance.
    """

    # API
    app_name: str = "OidaNice TScribe"
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Database
    # WHY: SQLite for simplicity - single file, no extra service needed.
    # Async via aiosqlite for non-blocking I/O in FastAPI.
    database_url: str = "sqlite+aiosqlite:////data/tscribe.db"

    # Redis
    # WHY: Redis as job queue backend because RQ (Redis Queue) is simpler
    # than Celery for our use case (no complex routing/scheduling needed).
    redis_url: str = "redis://redis:6379/0"

    # Worker
    # WHY: faster-whisper model size. "base" balances speed and accuracy
    # for most use cases. Can be overridden to "large-v3" for better quality.
    whisper_model: str = "base"
    # WHY: GPU dramatically speeds up transcription (10-50x).
    # Falls back to CPU automatically if CUDA unavailable.
    whisper_device: str = "auto"
    # WHY: int8 quantization cuts VRAM usage ~50% with minimal quality loss.
    whisper_compute_type: str = "int8"

    # Storage
    # WHY: Centralized temp/output directory for easy cleanup and volume mounting.
    data_dir: Path = Path("/data")
    # WHY: 24h auto-cleanup prevents disk from filling up with old transcriptions.
    cleanup_max_age_hours: int = 24

    model_config = {"env_file": ".env", "env_prefix": "TSCRIBE_"}


settings = Settings()
