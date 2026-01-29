"""Tests for the subtitle fetching and parsing module.

WHY: The subtitle-first approach is a critical optimization path. These tests
ensure the VTT/json3 parsers produce correct Segment data and that the
subtitle selection logic picks the right track.
"""

import json
from unittest.mock import MagicMock, patch

import pytest

# WHY: Import Segment from conftest (which provides the test-compatible
# version without requiring faster-whisper to be installed).
from conftest import Segment

from app.worker.subtitles import (
    _parse_json3_subtitles,
    _parse_vtt_subtitles,
    _select_subtitle_key,
)


# ---------------------------------------------------------------------------
# VTT parser tests
# ---------------------------------------------------------------------------


class TestParseVttSubtitles:
    """Tests for WebVTT subtitle parsing."""

    def test_basic_vtt(self):
        """Parse a minimal valid VTT file."""
        vtt = (
            "WEBVTT\n"
            "\n"
            "00:00:01.000 --> 00:00:04.500\n"
            "Hello world\n"
            "\n"
            "00:00:04.500 --> 00:00:08.000\n"
            "Second line\n"
        )
        segments = _parse_vtt_subtitles(vtt)
        assert len(segments) == 2
        assert segments[0].start == 1.0
        assert segments[0].end == 4.5
        assert segments[0].text == "Hello world"
        assert segments[1].start == 4.5
        assert segments[1].end == 8.0
        assert segments[1].text == "Second line"

    def test_vtt_with_hours(self):
        """Parse VTT with HH:MM:SS.mmm timestamps."""
        vtt = (
            "WEBVTT\n"
            "\n"
            "01:02:03.456 --> 01:02:07.890\n"
            "Long video segment\n"
        )
        segments = _parse_vtt_subtitles(vtt)
        assert len(segments) == 1
        expected_start = 1 * 3600 + 2 * 60 + 3 + 0.456
        expected_end = 1 * 3600 + 2 * 60 + 7 + 0.890
        assert abs(segments[0].start - expected_start) < 0.001
        assert abs(segments[0].end - expected_end) < 0.001

    def test_vtt_multiline_cue(self):
        """Parse VTT with multi-line cue text."""
        vtt = (
            "WEBVTT\n"
            "\n"
            "00:00:01.000 --> 00:00:04.000\n"
            "First line\n"
            "Second line\n"
        )
        segments = _parse_vtt_subtitles(vtt)
        assert len(segments) == 1
        assert segments[0].text == "First line Second line"

    def test_vtt_strips_html_tags(self):
        """VTT formatting tags like <c> and <b> are stripped."""
        vtt = (
            "WEBVTT\n"
            "\n"
            "00:00:01.000 --> 00:00:04.000\n"
            "<c>Tagged</c> <b>text</b>\n"
        )
        segments = _parse_vtt_subtitles(vtt)
        assert len(segments) == 1
        assert segments[0].text == "Tagged text"

    def test_empty_vtt(self):
        """Empty VTT returns no segments."""
        vtt = "WEBVTT\n\n"
        segments = _parse_vtt_subtitles(vtt)
        assert len(segments) == 0

    def test_vtt_with_cue_identifiers(self):
        """VTT with numbered cue identifiers (like SRT) still parses."""
        vtt = (
            "WEBVTT\n"
            "\n"
            "1\n"
            "00:00:01.000 --> 00:00:03.000\n"
            "First\n"
            "\n"
            "2\n"
            "00:00:03.000 --> 00:00:05.000\n"
            "Second\n"
        )
        segments = _parse_vtt_subtitles(vtt)
        assert len(segments) == 2
        assert segments[0].text == "First"
        assert segments[1].text == "Second"


# ---------------------------------------------------------------------------
# json3 parser tests
# ---------------------------------------------------------------------------


class TestParseJson3Subtitles:
    """Tests for YouTube json3 subtitle format parsing."""

    def test_basic_json3(self):
        """Parse minimal json3 with single-seg events."""
        data = {
            "events": [
                {
                    "tStartMs": 1000,
                    "dDurationMs": 3000,
                    "segs": [{"utf8": "Hello world"}],
                },
                {
                    "tStartMs": 5000,
                    "dDurationMs": 2000,
                    "segs": [{"utf8": "Second segment"}],
                },
            ]
        }
        segments = _parse_json3_subtitles(data)
        assert len(segments) == 2
        assert segments[0].start == 1.0
        assert segments[0].end == 4.0
        assert segments[0].text == "Hello world"
        assert segments[1].start == 5.0
        assert segments[1].end == 7.0

    def test_json3_multi_seg_event(self):
        """Multiple text fragments within one event are joined."""
        data = {
            "events": [
                {
                    "tStartMs": 0,
                    "dDurationMs": 5000,
                    "segs": [
                        {"utf8": "Hello"},
                        {"utf8": " "},
                        {"utf8": "world"},
                    ],
                }
            ]
        }
        segments = _parse_json3_subtitles(data)
        assert len(segments) == 1
        assert segments[0].text == "Hello world"

    def test_json3_skips_empty_events(self):
        """Events without segs key are skipped."""
        data = {
            "events": [
                {"tStartMs": 0, "dDurationMs": 1000},  # no segs
                {
                    "tStartMs": 1000,
                    "dDurationMs": 2000,
                    "segs": [{"utf8": "Text"}],
                },
            ]
        }
        segments = _parse_json3_subtitles(data)
        assert len(segments) == 1
        assert segments[0].text == "Text"

    def test_json3_skips_newline_only(self):
        """Events with only newline text are skipped."""
        data = {
            "events": [
                {
                    "tStartMs": 0,
                    "dDurationMs": 1000,
                    "segs": [{"utf8": "\n"}],
                }
            ]
        }
        segments = _parse_json3_subtitles(data)
        assert len(segments) == 0

    def test_json3_empty_events(self):
        """Empty events list returns no segments."""
        data = {"events": []}
        segments = _parse_json3_subtitles(data)
        assert len(segments) == 0


# ---------------------------------------------------------------------------
# Subtitle selection tests
# ---------------------------------------------------------------------------


class TestSelectSubtitleKey:
    """Tests for the subtitle track selection priority logic."""

    def test_manual_preferred_over_auto(self):
        """Manual subtitles in requested language win over auto."""
        subtitles = {"en": [{"ext": "vtt"}]}
        auto_captions = {"en": [{"ext": "vtt"}]}
        result = _select_subtitle_key(subtitles, auto_captions, "en")
        assert result == ("en", False)

    def test_auto_when_no_manual(self):
        """Auto-generated subtitles used when manual not available."""
        subtitles = {}
        auto_captions = {"en": [{"ext": "vtt"}]}
        result = _select_subtitle_key(subtitles, auto_captions, "en")
        assert result == ("en", True)

    def test_default_language_fallback(self):
        """Falls back to default languages (de, en) when requested not available."""
        subtitles = {}
        auto_captions = {"de": [{"ext": "vtt"}]}
        result = _select_subtitle_key(subtitles, auto_captions, "fr")
        assert result == ("de", True)

    def test_de_preferred_over_en(self):
        """German is preferred over English in default fallback."""
        subtitles = {}
        auto_captions = {"de": [{"ext": "vtt"}], "en": [{"ext": "vtt"}]}
        result = _select_subtitle_key(subtitles, auto_captions, None)
        assert result == ("de", True)

    def test_any_manual_as_last_resort(self):
        """Any manual subtitle is picked when nothing else matches."""
        subtitles = {"ja": [{"ext": "vtt"}]}
        auto_captions = {}
        result = _select_subtitle_key(subtitles, auto_captions, "fr")
        assert result == ("ja", False)

    def test_any_auto_as_absolute_last(self):
        """Any auto subtitle when nothing else available."""
        subtitles = {}
        auto_captions = {"ko": [{"ext": "vtt"}]}
        result = _select_subtitle_key(subtitles, auto_captions, "fr")
        assert result == ("ko", True)

    def test_no_subtitles_returns_none(self):
        """Returns None when no subtitles exist at all."""
        result = _select_subtitle_key({}, {}, "en")
        assert result is None

    def test_no_subtitles_no_language_returns_none(self):
        """Returns None with empty dicts and no language."""
        result = _select_subtitle_key({}, {}, None)
        assert result is None
