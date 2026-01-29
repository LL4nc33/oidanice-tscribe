"""SQLAlchemy database models.

WHY: Separate models file keeps database schema definition isolated
from business logic. Single Job model tracks the full lifecycle of
a transcription request from submission to completion.
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class JobStatus(str, enum.Enum):
    """Transcription job lifecycle states.

    WHY: Explicit enum prevents typos in status strings and documents
    the valid state transitions. str mixin allows JSON serialization.

    Flow: queued -> downloading -> transcribing -> done
                                                -> failed (from any state)
    """

    QUEUED = "queued"
    DOWNLOADING = "downloading"
    TRANSCRIBING = "transcribing"
    DONE = "done"
    FAILED = "failed"


class Job(Base):
    """A transcription job tracking a single video/audio URL.

    WHY: Stores all job metadata in one row for simple queries.
    The result_text field holds the plain transcript while formatted
    outputs (SRT/VTT) are generated on-demand from stored segments.
    """

    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    url: Mapped[str] = mapped_column(String(2048))
    status: Mapped[JobStatus] = mapped_column(
        Enum(JobStatus), default=JobStatus.QUEUED, index=True
    )

    # WHY: Store media title for display in the job list.
    # Populated after yt-dlp extracts metadata.
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # WHY: language=None means auto-detect. User can override for better
    # accuracy on known-language content.
    language: Mapped[str | None] = mapped_column(String(10), nullable=True)
    detected_language: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # WHY: Duration and progress enable the frontend progress bar.
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    progress: Mapped[int] = mapped_column(Integer, default=0)

    # WHY: Plain text result for quick display. Segment-level data
    # (with timestamps) stored as JSON for format exports.
    result_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    result_segments_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    # WHY: Store error message for failed jobs so the user knows what went wrong.
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
