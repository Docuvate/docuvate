# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Join OCR/PDF-wrapped lines into one logical field value."""

from __future__ import annotations

import re

_LABEL_LINE = re.compile(
    r"^\s*(?:[A-Za-zÄÖÜäöüß][\wÄÖÜäöüß./\-]{0,48})\s*[:\-\u2013\u2014]\s*\S",
    re.UNICODE,
)
_AMOUNT_TAIL = re.compile(r"^(?:EUR|€)\s*$", re.IGNORECASE)
_AMOUNT_HEAD = re.compile(
    r"^[0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2}$|^[0-9]+[.,][0-9]{2}$"
)


def _escape_label(label: str) -> str:
    return re.escape(label.strip())


def _line_starts_new_field(line: str, stop_labels: tuple[str, ...]) -> bool:
    stripped = line.strip()
    if not stripped:
        return False
    if not _LABEL_LINE.match(stripped):
        return False
    for stop in stop_labels:
        if not stop.strip():
            continue
        esc = _escape_label(stop)
        if re.match(rf"(?i){esc}\s*[:\-\u2013\u2014]", stripped):
            return True
    return True


_DATE_ONLY = re.compile(r"^\d{2}[./-]\d{2}[./-]\d{2,4}$")


def join_wrapped_value_lines(initial: str, continuation_lines: list[str]) -> str:
    """Merge soft-wrapped follow-up lines into one display value."""
    initial_stripped = initial.strip()
    if _DATE_ONLY.match(initial_stripped):
        return initial_stripped
    parts = [initial_stripped] if initial_stripped else []
    for raw in continuation_lines:
        line = raw.strip()
        if not line:
            break
        if not parts:
            parts.append(line)
            continue
        prev = parts[-1]
        if _AMOUNT_HEAD.search(prev) and _AMOUNT_TAIL.match(line):
            parts[-1] = f"{prev} {line}".strip()
            continue
        if prev.endswith("-") and line[:1].islower():
            parts[-1] = prev[:-1] + line
            continue
        if prev[-1:].isalnum() and line[:1].islower():
            parts[-1] = f"{prev} {line}"
            continue
        parts.append(line)
    return " ".join(p.strip() for p in parts if p.strip()).strip()


def extract_multiline_value_after_label(
    text: str,
    label: str,
    *,
    stop_labels: tuple[str, ...] = (),
    max_lines: int = 8,
    max_chars: int = 480,
    allow_continuation: bool = True,
) -> str | None:
    """Read value after ``Label:`` including wrapped continuation lines."""
    if not label.strip():
        return None
    esc = _escape_label(label)
    pattern = rf"(?im)^{esc}\s*[:\-\u2013\u2014]\s*(.*)$"
    match = re.search(pattern, text)
    if not match:
        return None
    first_line_value = match.group(1).strip()
    if not allow_continuation:
        value = first_line_value
    else:
        tail = text[match.end() :]
        continuation: list[str] = []
        for line in tail.splitlines():
            if len(continuation) >= max_lines - 1:
                break
            stripped = line.strip()
            if not stripped:
                if continuation:
                    break
                continue
            if _line_starts_new_field(line, stop_labels):
                break
            continuation.append(stripped)
        value = join_wrapped_value_lines(first_line_value, continuation)
    if not value:
        return None
    return value[:max_chars]
