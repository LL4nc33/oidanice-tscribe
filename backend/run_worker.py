"""RQ worker entry point for transcription job processing.

WHY: The worker runs as a separate process from the FastAPI server because
transcription is CPU/GPU-intensive work that would block async HTTP handlers.
RQ (Redis Queue) was chosen over Celery because:
- Simpler setup (no broker config beyond Redis URL)
- Sufficient for our use case (no complex routing or scheduling)
- Python-native job serialization (just pickle function + args)

Usage:
    python run_worker.py
"""

import logging
import sys

from redis import Redis
from rq import Queue

from app.config import settings
from app.worker.shutdown import GracefulWorker

# WHY: Configure logging before anything else so worker startup
# messages and job processing logs are visible.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("tscribe.worker")


def main() -> None:
    """Start the RQ worker listening on the 'tscribe' queue.

    WHY: Named queue ('tscribe') isolates our jobs from any other RQ
    jobs sharing the same Redis instance. The worker blocks and processes
    jobs sequentially, which is appropriate because transcription is
    resource-intensive and parallel jobs would compete for CPU/GPU.
    """
    redis_conn = Redis.from_url(settings.redis_url)
    queue = Queue("tscribe", connection=redis_conn)

    logger.info(
        "Starting TScribe worker (model=%s, device=%s, compute=%s)",
        settings.whisper_model,
        settings.whisper_device,
        settings.whisper_compute_type,
    )

    # WHY: GracefulWorker subclasses RQ's Worker to hook into SIGTERM handling.
    # On SIGTERM it sets a shutdown flag that the transcription loop checks
    # between segments, causing the job to fail cleanly instead of being
    # SIGKILL'd by Docker after the grace period expires.
    worker = GracefulWorker([queue], connection=redis_conn, name="tscribe-worker")

    # WHY: If the previous worker was killed (SIGKILL, OOM, power loss), its
    # registration key remains in Redis causing "active worker already exists".
    # Clean up the stale key before registering. Safe because this container
    # is the only worker instance (single-replica Docker service).
    stale_key = f"rq:worker:{worker.name}"
    if redis_conn.exists(stale_key):
        logger.warning("Cleaning up stale worker key: %s", stale_key)
        redis_conn.delete(stale_key)

    worker.work(with_scheduler=False)


if __name__ == "__main__":
    main()
