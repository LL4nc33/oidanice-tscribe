"""Audio transcription via faster-whisper.

WHY: faster-whisper uses CTranslate2 under the hood, providing ~4x speedup
over OpenAI's original Whisper implementation with equivalent accuracy.
This means transcriptions complete in minutes instead of tens of minutes,
especially on CPU where the difference is most noticeable.
"""

from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path

from faster_whisper import WhisperModel

from app.config import settings
from app.worker.shutdown import check_shutdown

# WHY: Module-level cached model instance. Loading a Whisper model takes
# 5-30 seconds depending on size. By caching at module level, we load once
# when the worker process starts and reuse for all subsequent jobs.
_model: WhisperModel | None = None


@dataclass(frozen=True)
class Segment:
    """A single transcription segment with timing information.

    WHY: Typed segment data enables format conversion (SRT/VTT/JSON)
    and frontend timestamp navigation. Frozen because transcription
    results are immutable facts.
    """

    start: float
    end: float
    text: str


@dataclass(frozen=True)
class TranscriptionResult:
    """Complete transcription output from faster-whisper.

    WHY: Bundles segments with detected language so callers get everything
    they need in one return value. Language detection is useful for the
    frontend to display and for future multi-language support.
    """

    segments: list[Segment] = field(default_factory=list)
    language: str = "unknown"


def _get_model() -> WhisperModel:
    """Load or return cached Whisper model.

    WHY: Lazy initialization ensures the model is only loaded when
    actually needed (not at import time), while the module-level cache
    ensures it's loaded at most once per worker process.
    """
    global _model
    if _model is None:
        _model = WhisperModel(
            settings.whisper_model,
            device=settings.whisper_device,
            compute_type=settings.whisper_compute_type,
        )
    return _model


def transcribe_audio(
    audio_path: Path,
    language: str | None = None,
    on_segment: Callable[[Segment], None] | None = None,
) -> TranscriptionResult:
    """Transcribe an audio file using faster-whisper.

    WHY: This is the core transcription step. It takes a local audio file
    and returns timed segments. Language can be specified to skip auto-detection
    and improve accuracy on known-language content.

    Args:
        audio_path: Path to audio file (any FFmpeg-supported format).
        language: ISO 639-1 language code (e.g., "en", "de") or None for
                  auto-detection.
        on_segment: Optional callback invoked after each segment is transcribed.
                    WHY: Enables the caller (tasks.py) to report real progress
                    as segments complete, instead of waiting for the full result.

    Returns:
        TranscriptionResult with timed segments and detected/specified language.

    Raises:
        FileNotFoundError: If audio_path does not exist.
        RuntimeError: If the Whisper model fails to process the audio.
    """
    model = _get_model()

    # WHY: beam_size=5 is the default that balances speed and accuracy.
    # faster-whisper returns an iterator, so we consume it into a list.
    segments_iter, info = model.transcribe(
        str(audio_path),
        language=language,
        beam_size=5,
    )

    # WHY: Iterate one segment at a time (instead of a list comprehension)
    # so the on_segment callback can fire between segments. This is what
    # enables real-time progress tracking during transcription.
    # Also checks for SIGTERM between segments so Docker shutdown doesn't
    # leave jobs stuck in TRANSCRIBING status forever.
    segments: list[Segment] = []
    for seg in segments_iter:
        # WHY: Check between segments (not mid-computation) because this is
        # the natural yield point. Whisper processes one segment at a time,
        # so worst case we finish one more segment (~5-30s) before exiting.
        check_shutdown()

        segment = Segment(start=seg.start, end=seg.end, text=seg.text.strip())
        segments.append(segment)
        if on_segment is not None:
            on_segment(segment)

    detected_language = info.language if info else (language or "unknown")

    return TranscriptionResult(segments=segments, language=detected_language)
