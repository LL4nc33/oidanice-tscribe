"""RQ task definitions for the transcription pipeline.

WHY: RQ tasks run in a separate worker process, isolating CPU/GPU-intensive
transcription from the async FastAPI server. This prevents transcription work
from blocking HTTP request handling. Each task function is the unit of work
that RQ serializes and dispatches to a worker.
"""

import json
import logging
import shutil
import time
from datetime import datetime, timezone

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Job, JobStatus
from app.worker.cleanup import cleanup_old_files
from app.worker.download import extract_audio
from app.worker.subtitles import fetch_subtitles
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
    the pipeline phases and manages job status updates. By catching all
    exceptions at the top level, we ensure every failure is recorded in
    the database instead of silently disappearing in the worker process.

    Pipeline (subtitle-first):
        0. DOWNLOADING - Try fetching existing subtitles (fast path, seconds)
           If found: skip to DONE immediately
        1. DOWNLOADING - Extract audio from URL via yt-dlp (fallback)
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
        # Phase 0: Try fetching existing subtitles (seconds vs minutes)
        # WHY: Many platforms (YouTube etc.) already have auto-generated or manual
        # subtitles. Fetching them takes seconds, while audio download + Whisper
        # takes ~5 minutes on CPU. We try subtitles first and only fall back to
        # the full pipeline if no subtitles are available.
        logger.info("Job %s: checking for existing subtitles at %s", job_id, url)
        with Session(sync_engine) as session:
            _update_job(session, job_id, status=JobStatus.DOWNLOADING)

        subtitle_info = fetch_subtitles(url, language)

        if subtitle_info is not None:
            # WHY: Subtitles found -- skip the entire download + transcription
            # pipeline. This is the fast path: no audio download, no Whisper.
            logger.info(
                "Job %s: using existing subtitles (%d segments, lang=%s)",
                job_id,
                len(subtitle_info.result.segments),
                subtitle_info.result.language,
            )

            segments_data = [
                {"start": seg.start, "end": seg.end, "text": seg.text}
                for seg in subtitle_info.result.segments
            ]
            plain_text = "\n".join(
                seg.text for seg in subtitle_info.result.segments
            )

            with Session(sync_engine) as session:
                _update_job(
                    session,
                    job_id,
                    status=JobStatus.DONE,
                    progress=100,
                    title=subtitle_info.title,
                    duration_seconds=subtitle_info.duration,
                    result_text=plain_text,
                    result_segments_json=json.dumps(
                        segments_data, ensure_ascii=False
                    ),
                    detected_language=subtitle_info.result.language,
                    completed_at=datetime.now(timezone.utc),
                    # WHY: Track that this job used the fast subtitle path
                    # so the frontend can show the transcription source.
                    source="subtitles",
                )

            logger.info("Job %s: completed via subtitles (fast path)", job_id)

        else:
            # WHY: No subtitles available -- fall back to the full pipeline.
            # This is the original code path: download audio, run Whisper.
            logger.info("Job %s: no subtitles found, falling back to audio download + Whisper", job_id)

            # Phase 1: Download
            logger.info("Job %s: downloading audio from %s", job_id, url)

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
                    # WHY: 5% signals download is done and transcription is starting.
                    # Gives immediate visual feedback before the first segment arrives.
                    progress=5,
                )

            # WHY: Build a progress callback that maps segment timestamps to
            # percentage complete. Throttled to avoid excessive DB writes --
            # only updates when progress changes by >= 5% or 30s have elapsed.
            total_duration = result.duration
            last_reported = {"pct": 5, "time": time.monotonic()}

            def _on_segment(segment) -> None:
                """Report transcription progress based on segment end timestamp."""
                if total_duration <= 0:
                    # WHY: If yt-dlp didn't provide duration (e.g., live streams),
                    # we cannot calculate percentage -- skip progress updates.
                    return

                # WHY: Map segment.end to 5-95% range. The 5% floor accounts for
                # the download phase; 95% ceiling reserves space for the final
                # DB-write phase. This prevents the bar from jumping backwards
                # or hitting 100% before the job is truly done.
                raw_pct = int(segment.end / total_duration * 90) + 5
                current_pct = min(raw_pct, 95)

                pct_delta = current_pct - last_reported["pct"]
                time_delta = time.monotonic() - last_reported["time"]

                # WHY: Throttle DB writes to every 5% change or every 30 seconds.
                # Without throttling, a 1-hour audio file generates ~3600 segments,
                # each triggering a DB write -- far too many for SQLite.
                if pct_delta >= 5 or (time_delta >= 30 and pct_delta >= 1):
                    with Session(sync_engine) as session:
                        _update_job(session, job_id, progress=current_pct)
                    last_reported["pct"] = current_pct
                    last_reported["time"] = time.monotonic()

            transcription = transcribe_audio(result.path, language, on_segment=_on_segment)

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
                    progress=100,
                    result_text=plain_text,
                    result_segments_json=json.dumps(
                        segments_data, ensure_ascii=False
                    ),
                    detected_language=transcription.language,
                    completed_at=datetime.now(timezone.utc),
                    # WHY: Track that this job used the slow Whisper path
                    # so the frontend can show the transcription source.
                    source="whisper",
                )

            logger.info("Job %s: completed via Whisper transcription", job_id)

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

    finally:
        # WHY: Audio files can be tens of MB per hour of content. Without
        # cleanup, many jobs will eventually fill the disk. We delete the job
        # directory after every run (success or failure) since results are
        # already in the database and the audio file is no longer needed.
        job_dir = settings.data_dir / job_id
        if job_dir.exists():
            shutil.rmtree(job_dir, ignore_errors=True)
            logger.info("Job %s: cleaned up job directory", job_id)

        # WHY: Run stale-file cleanup after every job as a simple alternative
        # to a separate scheduler. This catches leftover directories from
        # previous jobs that may have missed cleanup (e.g., worker killed).
        try:
            removed = cleanup_old_files()
            if removed:
                logger.info("Cleanup: removed %d stale job directories", removed)
        except Exception:
            logger.warning("Cleanup: failed to remove stale files", exc_info=True)


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
