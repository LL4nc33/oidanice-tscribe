"""Unit tests for transcription format converters.

Tests all four output formats (SRT, VTT, TXT, JSON) including edge cases
for empty and single-segment inputs. These tests are pure functions with
no external dependencies.
"""

import json

from app.worker.formats import (
    format_timestamp_srt,
    format_timestamp_vtt,
    to_json,
    to_srt,
    to_txt,
    to_vtt,
)


# ---- Timestamp formatting ------------------------------------------------


class TestFormatTimestampSrt:
    """SRT timestamps use comma as decimal separator: HH:MM:SS,mmm"""

    def test_zero(self):
        assert format_timestamp_srt(0.0) == "00:00:00,000"

    def test_simple_seconds(self):
        assert format_timestamp_srt(1.5) == "00:00:01,500"

    def test_minutes(self):
        assert format_timestamp_srt(65.0) == "00:01:05,000"

    def test_hours(self):
        assert format_timestamp_srt(3661.123) == "01:01:01,123"

    def test_millisecond_precision(self):
        result = format_timestamp_srt(0.001)
        assert result == "00:00:00,001"

    def test_comma_separator(self):
        """SRT uses comma, not dot, as decimal separator."""
        result = format_timestamp_srt(1.0)
        assert "," in result
        assert "." not in result


class TestFormatTimestampVtt:
    """VTT timestamps use dot as decimal separator: HH:MM:SS.mmm"""

    def test_zero(self):
        assert format_timestamp_vtt(0.0) == "00:00:00.000"

    def test_simple_seconds(self):
        assert format_timestamp_vtt(1.5) == "00:00:01.500"

    def test_hours(self):
        assert format_timestamp_vtt(3661.123) == "01:01:01.123"

    def test_dot_separator(self):
        """VTT uses dot, not comma, as decimal separator."""
        result = format_timestamp_vtt(1.0)
        assert "." in result
        assert "," not in result


# ---- SRT format ----------------------------------------------------------


class TestToSrt:
    def test_basic_output(self, sample_segments):
        result = to_srt(sample_segments)
        lines = result.split("\n")

        # First entry: sequence number, timestamp line, text, blank
        assert lines[0] == "1"
        assert "00:00:00,000 --> 00:00:02,500" in lines[1]
        assert lines[2] == "Hello world"
        assert lines[3] == ""

        # Second entry
        assert lines[4] == "2"
        assert "00:00:02,500 --> 00:00:05,000" in lines[5]
        assert lines[6] == "This is a test"

    def test_numbering_starts_at_one(self, sample_segments):
        result = to_srt(sample_segments)
        lines = result.split("\n")
        numbers = [lines[i] for i in range(0, len(lines) - 1, 4)]
        assert numbers == ["1", "2", "3"]

    def test_empty_segments(self, empty_segments):
        result = to_srt(empty_segments)
        assert result == ""

    def test_single_segment(self, single_segment):
        result = to_srt(single_segment)
        lines = result.split("\n")
        assert lines[0] == "1"
        assert "00:00:00,000 --> 00:00:01,000" in lines[1]
        assert lines[2] == "Only segment"

    def test_arrow_separator(self, sample_segments):
        """SRT uses ' --> ' between start and end timestamps."""
        result = to_srt(sample_segments)
        assert " --> " in result


# ---- VTT format ----------------------------------------------------------


class TestToVtt:
    def test_header(self, sample_segments):
        result = to_vtt(sample_segments)
        assert result.startswith("WEBVTT\n")

    def test_header_empty_segments(self, empty_segments):
        result = to_vtt(empty_segments)
        assert result.startswith("WEBVTT\n")

    def test_no_sequence_numbers(self, sample_segments):
        """VTT does not use sequence numbers like SRT does."""
        result = to_vtt(sample_segments)
        lines = result.split("\n")
        # After "WEBVTT" and blank line, first content line is a timestamp
        assert "-->" in lines[2]

    def test_dot_separator_in_timestamps(self, sample_segments):
        """VTT uses dot in timestamps, not comma."""
        result = to_vtt(sample_segments)
        # Remove the header, check timestamp lines
        for line in result.split("\n"):
            if "-->" in line:
                assert "." in line
                assert "," not in line

    def test_basic_content(self, sample_segments):
        result = to_vtt(sample_segments)
        assert "Hello world" in result
        assert "This is a test" in result
        assert "Third segment here" in result

    def test_single_segment(self, single_segment):
        result = to_vtt(single_segment)
        assert "WEBVTT" in result
        assert "Only segment" in result
        assert "00:00:00.000 --> 00:00:01.000" in result


# ---- TXT format ----------------------------------------------------------


class TestToTxt:
    def test_basic_output(self, sample_segments):
        result = to_txt(sample_segments)
        lines = result.split("\n")
        assert lines == ["Hello world", "This is a test", "Third segment here"]

    def test_no_timestamps(self, sample_segments):
        result = to_txt(sample_segments)
        assert "-->" not in result
        assert ":" not in result  # no HH:MM:SS

    def test_empty_segments(self, empty_segments):
        result = to_txt(empty_segments)
        assert result == ""

    def test_single_segment(self, single_segment):
        result = to_txt(single_segment)
        assert result == "Only segment"


# ---- JSON format ---------------------------------------------------------


class TestToJson:
    def test_valid_json(self, sample_segments):
        result = to_json(sample_segments)
        data = json.loads(result)
        assert isinstance(data, list)

    def test_segment_structure(self, sample_segments):
        result = to_json(sample_segments)
        data = json.loads(result)
        assert len(data) == 3

        first = data[0]
        assert first["start"] == 0.0
        assert first["end"] == 2.5
        assert first["text"] == "Hello world"

    def test_all_fields_present(self, sample_segments):
        result = to_json(sample_segments)
        data = json.loads(result)
        for seg in data:
            assert "start" in seg
            assert "end" in seg
            assert "text" in seg
            assert len(seg) == 3  # no extra fields

    def test_empty_segments(self, empty_segments):
        result = to_json(empty_segments)
        data = json.loads(result)
        assert data == []

    def test_single_segment(self, single_segment):
        result = to_json(single_segment)
        data = json.loads(result)
        assert len(data) == 1
        assert data[0]["text"] == "Only segment"

    def test_preserves_float_precision(self, sample_segments):
        """Timestamps like 8.123 should not lose precision in JSON."""
        result = to_json(sample_segments)
        data = json.loads(result)
        assert data[2]["end"] == 8.123
