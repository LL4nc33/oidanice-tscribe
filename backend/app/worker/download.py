"""Audio extraction from URLs via yt-dlp.

WHY: yt-dlp is the most actively maintained YouTube/media downloader,
supporting 1000+ sites. We extract audio-only in its native format because:
- Audio-only saves bandwidth (no video data transferred)
- Native format avoids slow re-encoding to WAV (~600MB/hr of uncompressed audio)
- faster-whisper decodes any FFmpeg-supported format natively, so WAV buys nothing
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
    """Download audio-only from a URL in its native compressed format.

    WHY: Separating download from transcription allows us to update job status
    between phases and gives clearer error messages (download failed vs
    transcription failed).

    Args:
        url: Media URL (YouTube, etc.) to extract audio from.
        job_id: Unique job identifier used as subdirectory name.

    Returns:
        DownloadResult with path to audio file, media title, and duration.

    Raises:
        yt_dlp.utils.DownloadError: If the URL is invalid or download fails.
    """
    output_dir = settings.data_dir / job_id
    output_dir.mkdir(parents=True, exist_ok=True)

    ydl_opts = {
        # WHY: bestaudio selects the highest quality audio-only stream,
        # avoiding unnecessary video data transfer.
        "format": "bestaudio/best",
        # WHY: No postprocessor -- faster-whisper decodes any FFmpeg-supported
        # format natively. Skipping WAV re-encoding saves minutes of CPU time
        # and ~600MB of disk per hour of audio.
        "outtmpl": str(output_dir / "audio.%(ext)s"),
        # WHY: Suppress yt-dlp console output in worker logs.
        "quiet": True,
        "no_warnings": True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)

    title = info.get("title", "Unknown")
    duration = float(info.get("duration", 0.0))

    # WHY: Without the WAV postprocessor, the file extension depends on what
    # the source provides (webm, m4a, opus, etc.). We glob for the actual
    # file instead of hardcoding an extension.
    audio_files = list(output_dir.glob("audio.*"))
    if not audio_files:
        raise FileNotFoundError(
            f"yt-dlp did not produce an audio file in {output_dir}"
        )
    output_path = audio_files[0]

    return DownloadResult(path=output_path, title=title, duration=duration)
