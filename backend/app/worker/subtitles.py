"""Subtitle fetching from video platforms via yt-dlp.

WHY: Many platforms (YouTube, etc.) already have auto-generated or manual
subtitles. Fetching existing subtitles takes seconds, while downloading audio
and running Whisper takes ~5 minutes on CPU. By trying subtitles first, we
can skip the expensive transcription pipeline entirely for most YouTube videos.
"""

import json
import logging
import re
from dataclasses import dataclass

import yt_dlp

from app.worker.transcribe import Segment, TranscriptionResult

logger = logging.getLogger(__name__)

# WHY: Preferred languages in priority order. German first because the
# primary user base is German-speaking, English as common fallback.
_DEFAULT_LANGUAGES = ["de", "en"]


@dataclass(frozen=True)
class SubtitleInfo:
    """Metadata extracted alongside subtitles.

    WHY: Even when we skip audio download, we still need the video title
    and duration for the job record. This bundles subtitle data with the
    metadata that would normally come from the download phase.
    """

    title: str
    duration: float
    result: TranscriptionResult


def _select_subtitle_key(
    subtitles: dict,
    auto_captions: dict,
    language: str | None,
) -> tuple[str, bool] | None:
    """Choose the best available subtitle track.

    WHY: Not all videos have subtitles in the requested language. We use
    a priority cascade to find the best match:
      1. Manual subs in requested language (highest quality)
      2. Auto-generated subs in requested language
      3. Manual subs in default languages (de, en)
      4. Auto-generated subs in default languages
      5. Any manual sub
      6. Any auto-generated sub
    Returns (language_key, is_auto) or None if no subtitles exist.
    """
    # WHY: Build ordered list of (source_dict, is_auto) to search through.
    # Manual subtitles are preferred because they are human-verified.
    sources = [
        (subtitles, False),
        (auto_captions, True),
    ]

    # Priority 1-2: Requested language (manual then auto)
    if language:
        for source, is_auto in sources:
            if language in source:
                return (language, is_auto)

    # Priority 3-4: Default languages (manual then auto for each lang)
    for lang in _DEFAULT_LANGUAGES:
        for source, is_auto in sources:
            if lang in source:
                return (lang, is_auto)

    # Priority 5: Any manual subtitle
    if subtitles:
        first_key = next(iter(subtitles))
        return (first_key, False)

    # Priority 6: Any auto-generated subtitle
    if auto_captions:
        first_key = next(iter(auto_captions))
        return (first_key, True)

    return None


def _find_json3_url(formats: list[dict]) -> str | None:
    """Find the json3 format URL from a list of subtitle formats.

    WHY: json3 is the easiest format to parse programmatically -- it contains
    structured segment data with start times and durations in milliseconds.
    This avoids writing fragile VTT/SRT timestamp parsers.
    """
    for fmt in formats:
        if fmt.get("ext") == "json3":
            return fmt.get("url")
    return None


def _parse_json3_subtitles(data: dict) -> list[Segment]:
    """Parse YouTube json3 subtitle format into Segment list.

    WHY: json3 provides events with start times (tStartMs) and durations
    (dDurationMs) in milliseconds. Each event may contain multiple text
    segments (segs). We flatten these into our standard Segment format
    with float seconds, matching Whisper output exactly.
    """
    segments: list[Segment] = []
    events = data.get("events", [])

    for event in events:
        # WHY: Skip events without text segments (e.g., format metadata,
        # window positioning events that YouTube includes in json3).
        segs = event.get("segs")
        if not segs:
            continue

        # WHY: Combine all text fragments within one event into a single
        # segment. YouTube splits words into separate segs within an event,
        # but our Segment model expects one text string per timed block.
        text_parts = []
        for s in segs:
            text = s.get("utf8", "").strip()
            if text and text != "\n":
                text_parts.append(text)

        combined_text = " ".join(text_parts).strip()
        if not combined_text:
            continue

        start_ms = event.get("tStartMs", 0)
        duration_ms = event.get("dDurationMs", 0)

        start = start_ms / 1000.0
        end = (start_ms + duration_ms) / 1000.0

        segments.append(Segment(start=start, end=end, text=combined_text))

    return segments


def _parse_vtt_subtitles(vtt_content: str) -> list[Segment]:
    """Parse WebVTT subtitle content into Segment list.

    WHY: Fallback parser for when json3 format is not available. VTT is
    the most common subtitle format across platforms. The regex handles
    both HH:MM:SS.mmm and MM:SS.mmm timestamp formats.
    """
    segments: list[Segment] = []

    # WHY: Match VTT timestamp lines like "00:00:01.500 --> 00:00:04.200"
    # The hours part is optional in VTT (MM:SS.mmm is valid).
    timestamp_re = re.compile(
        r"(\d{1,2}:)?(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*"
        r"(\d{1,2}:)?(\d{2}):(\d{2})[.,](\d{3})"
    )

    lines = vtt_content.strip().split("\n")
    i = 0
    while i < len(lines):
        match = timestamp_re.match(lines[i].strip())
        if match:
            groups = match.groups()
            # WHY: Parse start timestamp, handling optional hours.
            start_h = int(groups[0].rstrip(":")) if groups[0] else 0
            start_m = int(groups[1])
            start_s = int(groups[2])
            start_ms = int(groups[3])
            start = start_h * 3600 + start_m * 60 + start_s + start_ms / 1000.0

            # WHY: Parse end timestamp with same optional-hours logic.
            end_h = int(groups[4].rstrip(":")) if groups[4] else 0
            end_m = int(groups[5])
            end_s = int(groups[6])
            end_ms = int(groups[7])
            end = end_h * 3600 + end_m * 60 + end_s + end_ms / 1000.0

            # WHY: Collect all text lines until blank line or next timestamp.
            # VTT allows multi-line cue text.
            i += 1
            text_lines = []
            while i < len(lines) and lines[i].strip() and not timestamp_re.match(lines[i].strip()):
                # WHY: Strip VTT formatting tags like <c>, </c>, <b>, etc.
                clean = re.sub(r"<[^>]+>", "", lines[i].strip())
                if clean:
                    text_lines.append(clean)
                i += 1

            text = " ".join(text_lines).strip()
            if text:
                segments.append(Segment(start=start, end=end, text=text))
        else:
            i += 1

    return segments


def fetch_subtitles(
    url: str,
    language: str | None = None,
) -> SubtitleInfo | None:
    """Try to fetch existing subtitles from a URL without downloading media.

    WHY: This is the core of the subtitle-first optimization. By using
    yt-dlp with skip_download=True, we only fetch metadata and subtitle
    files -- no audio data is transferred. This reduces a 5-minute
    transcription job to a few seconds when subtitles are available.

    Args:
        url: Media URL (YouTube, etc.) to check for subtitles.
        language: Preferred language code (e.g., "de", "en") or None.

    Returns:
        SubtitleInfo with parsed segments and metadata, or None if no
        subtitles are available for this URL.
    """
    # WHY: Extract metadata only (skip_download) to check what subtitles
    # are available. writesubtitles + writeautomaticsub tell yt-dlp to
    # include subtitle info in the extracted metadata.
    ydl_opts = {
        "skip_download": True,
        "writesubtitles": True,
        "writeautomaticsub": True,
        "quiet": True,
        "no_warnings": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception:
        # WHY: If metadata extraction fails (e.g., geo-blocked, private video),
        # return None so the caller falls back to the full download pipeline.
        # The download phase will produce a more specific error message.
        logger.warning("Subtitle fetch: metadata extraction failed for %s", url, exc_info=True)
        return None

    if info is None:
        return None

    title = info.get("title", "Unknown")
    duration = float(info.get("duration", 0.0))
    subtitles = info.get("subtitles") or {}
    auto_captions = info.get("automatic_captions") or {}

    # WHY: Check if any subtitle track is available before proceeding.
    selection = _select_subtitle_key(subtitles, auto_captions, language)
    if selection is None:
        logger.info("Subtitle fetch: no subtitles available for %s", url)
        return None

    lang_key, is_auto = selection
    source = auto_captions if is_auto else subtitles
    formats = source.get(lang_key, [])

    logger.info(
        "Subtitle fetch: found %s subtitles in '%s' for %s",
        "auto-generated" if is_auto else "manual",
        lang_key,
        url,
    )

    # WHY: Try json3 first (easiest to parse), then fall back to VTT download.
    json3_url = _find_json3_url(formats)

    if json3_url:
        segments = _fetch_and_parse_json3(json3_url)
    else:
        segments = _fetch_and_parse_vtt(formats)

    if not segments:
        logger.info("Subtitle fetch: parsing yielded no segments for %s", url)
        return None

    detected_language = lang_key

    return SubtitleInfo(
        title=title,
        duration=duration,
        result=TranscriptionResult(segments=segments, language=detected_language),
    )


def _fetch_and_parse_json3(json3_url: str) -> list[Segment]:
    """Download and parse a json3 subtitle URL.

    WHY: json3 is YouTube's native structured subtitle format. Downloading
    it directly via yt-dlp's URL downloader gives us clean JSON data that
    maps directly to our Segment model.
    """
    try:
        # WHY: Use yt-dlp's built-in downloader to handle authentication
        # cookies and headers that may be needed for the subtitle URL.
        ydl_opts = {"quiet": True, "no_warnings": True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            response = ydl.urlopen(json3_url)
            data = json.loads(response.read().decode("utf-8"))

        return _parse_json3_subtitles(data)
    except Exception:
        logger.warning("Subtitle fetch: json3 download/parse failed", exc_info=True)
        return []


def _fetch_and_parse_vtt(formats: list[dict]) -> list[Segment]:
    """Download and parse a VTT subtitle from available formats.

    WHY: Fallback when json3 is not available. VTT is the most common
    subtitle format across platforms. We download to a temp file and
    parse the timestamp/text pairs.
    """
    # WHY: Find the best VTT format URL available.
    vtt_url = None
    for fmt in formats:
        if fmt.get("ext") in ("vtt", "srt"):
            vtt_url = fmt.get("url")
            break

    # WHY: If no VTT/SRT found, try any available format URL as last resort.
    if not vtt_url and formats:
        vtt_url = formats[0].get("url")

    if not vtt_url:
        return []

    try:
        ydl_opts = {"quiet": True, "no_warnings": True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            response = ydl.urlopen(vtt_url)
            content = response.read().decode("utf-8")

        return _parse_vtt_subtitles(content)
    except Exception:
        logger.warning("Subtitle fetch: VTT download/parse failed", exc_info=True)
        return []
