"""Pydantic schemas for API request/response validation.

WHY: Separate schemas from SQLAlchemy models because:
(1) API contracts should be independent of database schema
(2) Pydantic handles validation + serialization for FastAPI automatically
(3) Different endpoints need different views of the same data
"""

from datetime import datetime

from pydantic import BaseModel, HttpUrl

from app.models import JobStatus


class JobCreate(BaseModel):
    """Request schema for creating a new transcription job.

    WHY: Only url is required - language is optional because faster-whisper
    auto-detection works well for most content. Keeping the request minimal
    makes the API easy to use (just paste a URL).
    """

    url: HttpUrl
    language: str | None = None


class JobResponse(BaseModel):
    """Response schema for a single job.

    WHY: Exposes all fields the frontend needs for status display,
    progress tracking, and result viewing. model_config with
    from_attributes=True allows direct conversion from SQLAlchemy models.
    """

    id: str
    url: str
    status: JobStatus
    title: str | None = None
    language: str | None = None
    detected_language: str | None = None
    duration_seconds: float | None = None
    progress: int = 0
    result_text: str | None = None
    error: str | None = None
    source: str | None = None
    created_at: datetime
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}


class JobListResponse(BaseModel):
    """Response schema for job listing.

    WHY: Excludes result_text and segments to keep list responses lightweight.
    Full transcript is only fetched when viewing a specific job.
    """

    id: str
    url: str
    status: JobStatus
    title: str | None = None
    progress: int = 0
    source: str | None = None
    created_at: datetime
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}
