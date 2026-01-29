"""Periodic cleanup of old transcription files.

WHY: Without cleanup, the data directory grows indefinitely as users submit
transcription jobs. Audio files (WAV) can be 50-500 MB each, so even moderate
usage fills disks quickly. Automatic cleanup based on file age ensures the
service stays healthy without manual intervention.
"""

import shutil
import time

from app.config import settings


def cleanup_old_files() -> int:
    """Delete job directories in data_dir older than cleanup_max_age_hours.

    WHY: Scheduled cleanup prevents disk exhaustion. We delete entire job
    directories (not individual files) because a job's audio and outputs
    are always consumed together and have the same lifecycle.

    Returns:
        Number of directories removed.
    """
    max_age_seconds = settings.cleanup_max_age_hours * 3600
    now = time.time()
    removed = 0

    if not settings.data_dir.exists():
        return 0

    for entry in settings.data_dir.iterdir():
        if not entry.is_dir():
            continue

        # WHY: Use directory modification time as proxy for job age.
        # This is simpler than querying the database and works even if
        # the database is unavailable or the job record was already deleted.
        dir_age = now - entry.stat().st_mtime
        if dir_age > max_age_seconds:
            shutil.rmtree(entry, ignore_errors=True)
            removed += 1

    return removed
