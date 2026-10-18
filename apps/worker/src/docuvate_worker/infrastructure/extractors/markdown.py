# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Layout → Markdown for the default pipeline (internal storage only; no regex heuristics)."""

from __future__ import annotations

from docuvate_worker.domain.models import ExtractionBlock

LINE_Y_TOLERANCE = 0.014


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


def _median_line_height(lines: list[list[ExtractionBlock]]) -> float:
    heights = [max(b.height for b in line) for line in lines if line]
    if not heights:
        return 0.02
    heights.sort()
    mid = len(heights) // 2
    return heights[mid]


def _leading_bullet_prefix(line: str) -> str | None:
    stripped = line.lstrip()
    if not stripped:
        return None
    if stripped.startswith(("- ", "• ", "* ")):
        return stripped
    if len(stripped) > 2 and stripped[0].isdigit():
        idx = 0
        while idx < len(stripped) and stripped[idx].isdigit():
            idx += 1
        if idx < len(stripped) and stripped[idx] in ".)" and stripped[idx + 1 : idx + 2] == " ":
            return stripped
    return None


def _line_looks_like_heading(line: str, line_height: float, median_height: float) -> bool:
    stripped = line.strip()
    if not stripped or len(stripped) > 72 or "  " in stripped:
        return False
    if median_height > 0 and line_height >= median_height * 1.18:
        return True
    letters = [char for char in stripped if char.isalpha()]
    if len(letters) >= 3 and all(char.isupper() for char in letters):
        return True
    return False


def _format_line_as_markdown(line: str, line_height: float, median_height: float) -> str:
    if not line:
        return ""
    bullet = _leading_bullet_prefix(line)
    if bullet is not None:
        return bullet
    if _line_looks_like_heading(line, line_height, median_height):
        return f"## {line.strip()}"
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
        line_groups = _group_blocks_into_lines(blocks, page)
        median_h = _median_line_height(line_groups)
        for line_blocks in line_groups:
            raw = _line_text(line_blocks)
            if not raw:
                continue
            line_height = max(b.height for b in line_blocks)
            page_lines.append(_format_line_as_markdown(raw, line_height, median_h))
        chunk = "\n".join(page_lines).strip()
        if chunk:
            parts.append(chunk)
    return "\n\n".join(parts).strip()


def _split_paragraphs(text: str) -> list[list[str]]:
    paragraphs: list[list[str]] = []
    current: list[str] = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            if current:
                paragraphs.append(current)
                current = []
            continue
        current.append(line)
    if current:
        paragraphs.append(current)
    return paragraphs


def plain_text_to_markdown(text: str) -> str:
    stripped = text.strip()
    if not stripped:
        return ""
    out: list[str] = []
    for lines in _split_paragraphs(stripped):
        if len(lines) == 1:
            out.append(_format_line_as_markdown(lines[0], 0.02, 0.02))
        else:
            for ln in lines:
                out.append(_format_line_as_markdown(ln, 0.02, 0.02))
            out.append("")
    return "\n".join(out).strip()


def _strip_md_heading_prefix(line: str) -> str:
    pos = 0
    while pos < len(line) and line[pos] == "#":
        pos += 1
    if pos > 0 and pos < len(line) and line[pos] == " ":
        return line[pos + 1 :].strip()
    return line.strip()


def markdown_to_plain(md: str) -> str:
    lines: list[str] = []
    for raw in md.splitlines():
        line = raw.strip()
        if not line:
            lines.append("")
            continue
        if line.startswith("#"):
            line = _strip_md_heading_prefix(line)
        line = line.replace("**", "").replace("__", "").replace("*", "").replace("`", "").replace("~", "")
        lines.append(line.strip())
    plain = "\n".join(lines)
    while "\n\n\n" in plain:
        plain = plain.replace("\n\n\n", "\n\n")
    return plain.strip()


def extraction_to_markdown(text: str, blocks: list[ExtractionBlock] | None) -> str | None:
    md = blocks_to_markdown(blocks) if blocks else plain_text_to_markdown(text)
    md = md.strip()
    return md or None
