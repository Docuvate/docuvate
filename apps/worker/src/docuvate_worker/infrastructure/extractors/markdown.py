# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Lightweight layout → Markdown for the default pipeline (no Docling)."""

from __future__ import annotations

import re

from docuvate_worker.domain.models import ExtractionBlock

LINE_Y_TOLERANCE = 0.014

_BULLET_RE = re.compile(r"^(\d+[\.\)]\s|[-•*]\s)")
_HEADING_RE = re.compile(r"^[A-Z0-9][A-Z0-9\s\-–—&.,'\"()/]{2,}$")


def _group_blocks_into_lines(
    blocks: list[ExtractionBlock], page: int
) -> list[list[ExtractionBlock]]:
    sorted_blocks = sorted(
        (b for b in blocks if b.page == page),
        key=lambda b: (b.y, b.x),
    )
    lines: list[list[ExtractionBlock]] = []
    for block in sorted_blocks:
        if not block.text.strip():
            continue
        last = lines[-1] if lines else None
        if last and abs(last[0].y - block.y) <= LINE_Y_TOLERANCE:
            last.append(block)
        else:
            lines.append([block])
    for line in lines:
        line.sort(key=lambda b: b.x)
    return lines


def _line_text(line: list[ExtractionBlock]) -> str:
    return " ".join(b.text.strip() for b in line if b.text.strip()).strip()


def _format_line_as_markdown(line: str) -> str:
    if not line:
        return ""
    if _BULLET_RE.match(line):
        return line
    if len(line) <= 72 and _HEADING_RE.match(line) and "  " not in line:
        return f"## {line}"
    return line


def blocks_to_markdown(blocks: list[ExtractionBlock]) -> str:
    if not blocks:
        return ""
    pages = sorted({b.page for b in blocks})
    parts: list[str] = []
    multi_page = len(pages) > 1
    for page in pages:
        page_lines: list[str] = []
        if multi_page:
            page_lines.append(f"## Page {page}")
            page_lines.append("")
        for line_blocks in _group_blocks_into_lines(blocks, page):
            raw = _line_text(line_blocks)
            if not raw:
                continue
            page_lines.append(_format_line_as_markdown(raw))
        chunk = "\n".join(page_lines).strip()
        if chunk:
            parts.append(chunk)
    return "\n\n".join(parts).strip()


def plain_text_to_markdown(text: str) -> str:
    """Fallback when no layout blocks exist."""
    stripped = text.strip()
    if not stripped:
        return ""
    paragraphs = re.split(r"\n\s*\n", stripped)
    out: list[str] = []
    for para in paragraphs:
        lines = [ln.strip() for ln in para.splitlines() if ln.strip()]
        if not lines:
            continue
        if len(lines) == 1:
            out.append(_format_line_as_markdown(lines[0]))
        else:
            out.extend(_format_line_as_markdown(ln) for ln in lines)
            out.append("")
    return "\n".join(out).strip()


def markdown_to_plain(md: str) -> str:
    """Best-effort plain text for downstream heuristics (Docling path)."""
    lines: list[str] = []
    for raw in md.splitlines():
        line = raw.strip()
        if not line:
            lines.append("")
            continue
        if line.startswith("#"):
            line = re.sub(r"^#+\s*", "", line).strip()
        line = re.sub(r"!\[[^\]]*\]\([^)]+\)", "", line)
        line = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", line)
        line = re.sub(r"[*_`~]", "", line)
        lines.append(line.strip())
    return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()


def extraction_to_markdown(text: str, blocks: list[ExtractionBlock] | None) -> str | None:
    if blocks:
        md = blocks_to_markdown(blocks)
    else:
        md = plain_text_to_markdown(text)
    md = md.strip()
    return md or None
