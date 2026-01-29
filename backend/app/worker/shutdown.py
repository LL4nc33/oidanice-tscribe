"""Cooperative shutdown flag for graceful SIGTERM handling.

WHY: Docker sends SIGTERM on `docker stop`, then SIGKILL after the grace period
(default 10s). Transcription jobs can run for minutes/hours, so the worker will
get SIGKILL mid-transcription and leave the job stuck in TRANSCRIBING forever.

Solution: A shared flag that the signal handler sets and the transcription loop
checks between segments. This lets the existing except-block in process_job()
mark the job as FAILED instead of leaving it in a zombie state.
"""

import logging

from rq import Worker

logger = logging.getLogger(__name__)

# WHY: Module-level flag checked by the transcription segment loop.
# Threading is not involved (RQ workers are single-process), but the flag
# must be accessible from both the signal handler and the transcription code.
_shutdown_requested: bool = False


class ShutdownInterrupt(Exception):
    """Raised when SIGTERM is received during transcription.

    WHY: A custom exception (not KeyboardInterrupt or SystemExit) so it flows
    through the normal except-Exception block in process_job(), which marks
    the job as FAILED with a clear error message.
    """


def check_shutdown() -> None:
    """Raise ShutdownInterrupt if SIGTERM was received.

    WHY: Called between transcription segments. This is the cooperative
    cancellation point -- the transcription loop yields control here,
    allowing a clean exit instead of being SIGKILL'd mid-computation.
    """
    if _shutdown_requested:
        raise ShutdownInterrupt(
            "Worker received SIGTERM -- shutting down gracefully"
        )


class GracefulWorker(Worker):
    """RQ Worker subclass that sets the shutdown flag on SIGTERM.

    WHY: RQ's Worker.work() calls self._install_signal_handlers() which
    overwrites any previously installed signal handlers. Subclassing and
    overriding request_stop() is the only reliable way to hook into RQ's
    SIGTERM handling without fighting the framework.

    RQ's default request_stop() sets _stop_requested=True and waits for the
    current job to finish. For short jobs that works fine, but transcription
    jobs can run for hours. Our override additionally sets the shutdown flag,
    which the transcription loop checks between segments and raises
    ShutdownInterrupt to fail the job cleanly.
    """

    def request_stop(self, signum, frame) -> None:
        """Handle SIGTERM: set our flag, then delegate to RQ's default."""
        global _shutdown_requested
        logger.warning(
            "SIGTERM received -- requesting graceful shutdown. "
            "Current job (if any) will be marked as FAILED."
        )
        _shutdown_requested = True
        # WHY: Still call RQ's default handler so the worker loop also knows
        # to stop after the (now quickly-failing) job completes. Without this,
        # the worker would pick up the next job from the queue after the
        # current one fails.
        super().request_stop(signum, frame)
