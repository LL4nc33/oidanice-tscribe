"""RQ task definitions for the transcription pipeline.

WHY: RQ tasks run in a separate worker process, isolating CPU/GPU-intensive
transcription from the async FastAPI server. This prevents transcription work
from blocking HTTP request handling. Each task function is the unit of work
that RQ serializes and dispatches to a worker.
"""

import json
import logging
from datetime import datetime, timezone

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Job, JobStatus
from app.worker.download import extract_audio
from app.worker.transcribe import transcribe_audio

logger = logging.getLogger(__name__)

# WHY: Sync SQLAlchemy engine for the worker process. RQ workers are
# synchronous (no asyncio event loop), so we cannot use the async engine
# from database.py. We derive the sync URL from the configured async URL
# by stripping the "+aiosqlite" dialect suffix.
_sync_db_url = settings.database_url.replace("+aiosqlite", "")
sync_engine = create_engine(
    _sync_db_url,
    connect_args={"check_same_thread": False},
    echo=settings.debug,
)


def _update_job(session: Session, job_id: str, **kwargs) -> None:
    """Update job fields in a single commit.

    WHY: Centralizes the get-update-commit pattern to avoid repetition
    and ensure every status change is immediately committed (visible to
    the API server reading from the same SQLite file).
    """
    job = session.get(Job, job_id)
    if job is None:
        raise ValueError(f"Job {job_id} not found in database")
    for key, value in kwargs.items():
        setattr(job, key, value)
    session.commit()


def process_job(job_id: str) -> None:
    """Main RQ task: orchestrate the full transcription pipeline.

    WHY: This is the single entry point that RQ calls. It coordinates
    the pipeline phases (download -> transcribe -> format) and manages
    job status updates. By catching all exceptions at the top level,
    we ensure every failure is recorded in the database instead of
    silently disappearing in the worker process.

    Pipeline:
        1. DOWNLOADING - Extract audio from URL via yt-dlp
        2. TRANSCRIBING - Run faster-whisper on the audio
        3. DONE - Store results and mark complete

    Args:
        job_id: UUID of the job to process (must exist in database).
    """
    with Session(sync_engine) as session:
        # WHY: Load language preference before starting the pipeline.
        # This is the only field we need from the initial job record.
        job = session.get(Job, job_id)
        if job is None:
            logger.error("Job %s not found, skipping", job_id)
            return
        url = job.url
        language = job.language

    try:
        # Phase 1: Download
        logger.info("Job %s: downloading audio from %s", job_id, url)
        with Session(sync_engine) as session:
            _update_job(session, job_id, status=JobStatus.DOWNLOADING)

        result = extract_audio(url, job_id)

        # Phase 2: Transcribe
        logger.info("Job %s: transcribing audio (%s)", job_id, result.title)
        with Session(sync_engine) as session:
            _update_job(
                session,
                job_id,
                status=JobStatus.TRANSCRIBING,
                title=result.title,
                duration_seconds=result.duration,
            )

        transcription = transcribe_audio(result.path, language)

        # Phase 3: Store results
        segments_data = [
            {"start": seg.start, "end": seg.end, "text": seg.text}
            for seg in transcription.segments
        ]
        plain_text = "\n".join(seg.text for seg in transcription.segments)

        with Session(sync_engine) as session:
            _update_job(
                session,
                job_id,
                status=JobStatus.DONE,
                result_text=plain_text,
                result_segments_json=json.dumps(
                    segments_data, ensure_ascii=False
                ),
                detected_language=transcription.language,
                completed_at=datetime.now(timezone.utc),
            )

        logger.info("Job %s: completed successfully", job_id)

    except Exception:
        # WHY: Catch-all ensures every failure is recorded in the database.
        # Without this, a crashed worker leaves the job stuck in a non-terminal
        # state with no error information for the user.
        logger.exception("Job %s: failed", job_id)
        error_msg = _format_error()
        with Session(sync_engine) as session:
            _update_job(
                session,
                job_id,
                status=JobStatus.FAILED,
                error=error_msg,
                completed_at=datetime.now(timezone.utc),
            )


def _format_error() -> str:
    """Format the current exception as a user-friendly error message.

    WHY: Raw tracebacks are overwhelming for users. We extract just the
    exception type and message, which is enough to understand what went
    wrong (e.g., "DownloadError: Video unavailable").
    """
    import sys

    exc_type, exc_value, _ = sys.exc_info()
    if exc_type is None:
        return "Unknown error"
    type_name = exc_type.__name__
    return f"{type_name}: {exc_value}"
