"""Transcription output format converters.

WHY: Different use cases need different formats:
- SRT: Most widely supported subtitle format (VLC, Premiere, etc.)
- VTT: Web-native subtitle format (HTML5 <track> element)
- TXT: Plain reading, copy-paste, further text processing
- JSON: Programmatic access, custom frontends, API consumers

All formatters take the same segment list, making it easy to add new formats.
"""

import json
from typing import Sequence

from app.worker.transcribe import Segment


def format_timestamp_srt(seconds: float) -> str:
    """Convert seconds to SRT timestamp format (HH:MM:SS,mmm).

    WHY: SRT uses comma as decimal separator (not dot), which is a common
    source of bugs. Centralizing this formatting prevents that mistake.
    """
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def format_timestamp_vtt(seconds: float) -> str:
    """Convert seconds to WebVTT timestamp format (HH:MM:SS.mmm).

    WHY: VTT uses dot as decimal separator (unlike SRT's comma).
    Having separate functions makes the difference explicit and testable.
    """
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def to_srt(segments: Sequence[Segment]) -> str:
    """Convert segments to SRT subtitle format.

    WHY: SRT is the most widely supported subtitle format across video
    players and editing software. Its simplicity (numbered entries with
    timestamps) makes it robust and easy to parse.

    Format:
        1
        00:00:01,000 --> 00:00:04,500
        Hello world

        2
        ...
    """
    lines: list[str] = []
    for i, seg in enumerate(segments, start=1):
        lines.append(str(i))
        start = format_timestamp_srt(seg.start)
        end = format_timestamp_srt(seg.end)
        lines.append(f"{start} --> {end}")
        lines.append(seg.text)
        lines.append("")  # Blank line between entries
    return "\n".join(lines)


def to_vtt(segments: Sequence[Segment]) -> str:
    """Convert segments to WebVTT subtitle format.

    WHY: WebVTT is the W3C standard for HTML5 video subtitles. Required
    for browser-native subtitle display via the <track> element. Also
    supported by most modern video players.

    Format:
        WEBVTT

        00:00:01.000 --> 00:00:04.500
        Hello world

        ...
    """
    lines: list[str] = ["WEBVTT", ""]
    for seg in segments:
        start = format_timestamp_vtt(seg.start)
        end = format_timestamp_vtt(seg.end)
        lines.append(f"{start} --> {end}")
        lines.append(seg.text)
        lines.append("")  # Blank line between entries
    return "\n".join(lines)


def to_txt(segments: Sequence[Segment]) -> str:
    """Convert segments to plain text, one segment per line.

    WHY: Plain text is the simplest format for reading transcripts,
    copy-pasting into documents, or feeding into text processing tools
    (summarization, translation, etc.) that don't need timing data.
    """
    return "\n".join(seg.text for seg in segments)


def to_json(segments: Sequence[Segment]) -> str:
    """Convert segments to JSON array with start/end/text.

    WHY: JSON enables programmatic access to segment-level timing data
    for custom frontends, API consumers, or downstream processing
    pipelines that need structured data.

    Output format:
        [{"start": 0.0, "end": 4.5, "text": "Hello world"}, ...]
    """
    data = [
        {"start": seg.start, "end": seg.end, "text": seg.text}
        for seg in segments
    ]
    return json.dumps(data, ensure_ascii=False, indent=2)
