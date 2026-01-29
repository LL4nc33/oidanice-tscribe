"""Top-level RQ task entry points.

WHY: RQ's import_attribute resolves dotted paths like 'worker_entry.process_job'
more reliably than deeply nested paths like 'app.worker.tasks.process_job'.
This module is a thin wrapper that imports lazily to avoid loading heavy
dependencies (faster-whisper, yt-dlp) until the function is actually called.
"""


def process_job(job_id: str) -> None:
    """Delegate to the actual task implementation.

    WHY: Lazy import so that 'import worker_entry' in the API process
    does NOT load faster-whisper (~500MB VRAM). The heavy import only
    happens when the worker actually calls this function.
    """
    from app.worker.tasks import process_job as _process_job

    _process_job(job_id)
