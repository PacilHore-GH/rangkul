"""Plain-text normalization for user supplied profile fields."""

import re
import unicodedata

SCRIPT_STYLE_RE = re.compile(r"<(script|style)\b[^>]*>[\s\S]*?</\1>", re.IGNORECASE)
TAG_RE = re.compile(r"<[^>]*>")
CONTROL_SINGLE_LINE_RE = re.compile(r"[\x00-\x1f\x7f-\x9f]")
CONTROL_MULTILINE_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]")


def _without_markup(value: str) -> str:
    value = unicodedata.normalize("NFKC", value)
    value = SCRIPT_STYLE_RE.sub("", value)
    value = TAG_RE.sub("", value)
    return value.replace("<", "").replace(">", "")


def sanitize_single_line(value: str, max_length: int) -> str:
    value = CONTROL_SINGLE_LINE_RE.sub(" ", _without_markup(value))
    return " ".join(value.split())[:max_length]


def sanitize_multiline(value: str, max_length: int) -> str:
    value = CONTROL_MULTILINE_RE.sub("", _without_markup(value))
    value = value.replace("\r\n", "\n").replace("\r", "\n")
    return value.strip()[:max_length]
