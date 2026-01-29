"""Audio extraction from URLs via yt-dlp.

WHY: yt-dlp is the most actively maintained YouTube/media downloader,
supporting 1000+ sites. We extract audio-only as WAV because:
- Audio-only saves bandwidth (no video data transferred)
- WAV provides uncompressed audio for best Whisper transcription quality
- yt-dlp handles all the site-specific extraction logic we'd never want to write
"""

from dataclasses import dataclass
from pathlib import Path

import yt_dlp

from app.config import settings


@dataclass(frozen=True)
class DownloadResult:
    """Result of audio extraction from a URL.

    WHY: Dataclass bundles the three pieces of information we need from
    yt-dlp (file path, title, duration) into a single typed return value.
    Frozen because download results are facts - they should not be mutated.
    """

    path: Path
    title: str
    duration: float


def extract_audio(url: str, job_id: str) -> DownloadResult:
    """Download audio-only from a URL and convert to WAV.

    WHY: Separating download from transcription allows us to update job status
    between phases and gives clearer error messages (download failed vs
    transcription failed). WAV output ensures Whisper gets clean input.

    Args:
        url: Media URL (YouTube, etc.) to extract audio from.
        job_id: Unique job identifier used as subdirectory name.

    Returns:
        DownloadResult with path to WAV file, media title, and duration.

    Raises:
        yt_dlp.utils.DownloadError: If the URL is invalid or download fails.
    """
    output_dir = settings.data_dir / job_id
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "audio.wav"

    # WHY: We extract info first, then download. This lets us capture title
    # and duration before the (potentially slow) audio conversion step.
    ydl_opts = {
        # WHY: bestaudio selects the highest quality audio-only stream,
        # avoiding unnecessary video data transfer.
        "format": "bestaudio/best",
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                # WHY: WAV is uncompressed - no lossy re-encoding means
                # Whisper gets the highest fidelity input possible.
                "preferredcodec": "wav",
            }
        ],
        # WHY: Use template that yt-dlp will rename to .wav after postprocessing.
        "outtmpl": str(output_dir / "audio.%(ext)s"),
        # WHY: Suppress yt-dlp console output in worker logs.
        "quiet": True,
        "no_warnings": True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)

    title = info.get("title", "Unknown")
    duration = float(info.get("duration", 0.0))

    return DownloadResult(path=output_path, title=title, duration=duration)
