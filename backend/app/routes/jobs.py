"""Job management endpoints for transcription requests.

WHY: Centralizes all job CRUD operations in one router. Each endpoint
maps to a clear user action: submit a URL, check status, view result,
download formatted transcript, or clean up old jobs.
"""

import json
import logging
import shutil
import uuid

from fastapi import APIRouter, Depends, HTTPException, Response
from redis import Redis
from rq import Queue
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import Job, JobStatus
from app.schemas import JobCreate, JobListResponse, JobResponse

router = APIRouter()
logger = logging.getLogger(__name__)

# WHY: Module-level Redis connection and queue are reused across requests
# to avoid reconnecting on every call. RQ handles connection pooling internally.
redis_conn = Redis.from_url(settings.redis_url)
queue = Queue("tscribe", connection=redis_conn)


@router.post("/", response_model=JobResponse, status_code=201)
async def create_job(payload: JobCreate, db: AsyncSession = Depends(get_db)):
    """Accept a URL and enqueue it for transcription.

    WHY: The API immediately persists the job and returns a reference ID
    so the client can poll for status. Actual transcription runs async
    in the RQ worker to keep API response times fast (<100ms).
    The UUID is generated server-side to guarantee uniqueness.
    """
    job_id = str(uuid.uuid4())

    job = Job(
        id=job_id,
        url=str(payload.url),
        language=payload.language,
        status=JobStatus.QUEUED,
    )

    db.add(job)
    await db.commit()
    await db.refresh(job)

    # WHY: Enqueue by string path to top-level module so RQ resolves it
    # reliably. worker_entry.process_job lazy-imports the actual task,
    # keeping the API process free of heavy deps (faster-whisper, yt-dlp).
    queue.enqueue("worker_entry.process_job", job.id, job_timeout=settings.job_timeout_seconds)

    return job


@router.get("/", response_model=list[JobListResponse])
async def list_jobs(db: AsyncSession = Depends(get_db)):
    """Return recent jobs ordered by creation time.

    WHY: Limited to 50 rows to keep the response snappy and prevent
    accidental full-table dumps. Newest first because users care most
    about their latest submissions. Uses JobListResponse which excludes
    result_text to keep the payload lightweight for list views.
    """
    stmt = select(Job).order_by(Job.created_at.desc()).limit(50)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch a single job with full details including transcript text.

    WHY: Separating the detail view from the list view allows including
    the potentially large result_text only when the user actually opens
    a specific job, saving bandwidth on the list page.
    """
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.delete("/{job_id}", status_code=204)
async def delete_job(job_id: str, db: AsyncSession = Depends(get_db)):
    """Remove a job, its files on disk, and its database record.

    WHY: Allows users to clean up jobs they no longer need. Returns 204
    (No Content) per REST convention for successful deletions. Raises 404
    if the job does not exist to prevent silent no-ops that confuse clients.
    Files are deleted first to avoid orphaned directories on disk.
    """
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # WHY: Remove associated files before the DB record to prevent orphaned
    # directories from accumulating on disk. If file deletion fails, we log
    # a warning but still proceed with DB deletion so the job is not stuck.
    job_dir = settings.data_dir / job_id
    if job_dir.is_dir():
        try:
            shutil.rmtree(job_dir)
            logger.info("Deleted job directory: %s", job_dir)
        except OSError:
            logger.warning("Failed to delete job directory: %s", job_dir, exc_info=True)

    await db.delete(job)
    await db.commit()
    return Response(status_code=204)


@router.get("/{job_id}/download/{fmt}")
async def download_transcript(
    job_id: str, fmt: str, db: AsyncSession = Depends(get_db)
):
    """Download the transcript in the requested format (srt, vtt, txt, json).

    WHY: On-demand format conversion from stored segments avoids persisting
    multiple copies of the same transcript. The worker stores raw segments
    as JSON; this endpoint converts to the requested output format at
    download time. This keeps storage minimal and supports adding new
    formats without re-processing.
    """
    valid_formats = {"srt", "vtt", "txt", "json"}
    if fmt not in valid_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid format '{fmt}'. Must be one of: {', '.join(sorted(valid_formats))}",
        )

    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status != JobStatus.DONE:
        raise HTTPException(
            status_code=409,
            detail="Transcript not yet available. Job status: " + job.status.value,
        )

    # WHY: Import format functions lazily to avoid loading worker
    # dependencies (faster-whisper, etc.) in the API process. Only the
    # lightweight format converters are needed here.
    from app.worker.formats import to_json, to_srt, to_txt, to_vtt
    from app.worker.transcribe import Segment

    raw_segments = json.loads(job.result_segments_json) if job.result_segments_json else []
    segments = [Segment(**s) for s in raw_segments]

    # WHY: Content-type mapping ensures browsers and tools handle the
    # downloaded file correctly. text/plain for SRT/VTT is intentional
    # to allow in-browser preview; attachment header triggers download.
    format_handlers = {
        "srt": (to_srt, "text/srt", "transcript.srt"),
        "vtt": (to_vtt, "text/vtt", "transcript.vtt"),
        "txt": (to_txt, "text/plain", "transcript.txt"),
        "json": (to_json, "application/json", "transcript.json"),
    }

    handler, content_type, filename = format_handlers[fmt]
    content = handler(segments)

    return Response(
        content=content,
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
