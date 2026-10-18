# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Build encoding units from layout-aware text (paragraph fallback)."""

from __future__ import annotations

from dataclasses import dataclass

from docuvate_worker.domain.cpu_pipeline.contracts import LunaStageData, TacoStageData
from docuvate_worker.domain.layout_ir import LayoutIrDocument
from docuvate_worker.domain.models import ExtractionBlock


@dataclass(frozen=True)
class RepresentationUnit:
    unit_index: int
    kind: str
    text: str
    page: int | None
    x: float | None
    y: float | None
    width: float | None
    height: float | None
    char_start: int | None
    char_end: int | None


def paragraph_units_from_text(text: str) -> list[tuple[str, int | None, int | None]]:
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    if not normalized.strip():
        return []
    parts: list[tuple[str, int | None, int | None]] = []
    cursor = 0
    for block in normalized.split("\n\n"):
        stripped = block.strip()
        if not stripped:
            cursor += len(block) + 2
            continue
        start = normalized.find(stripped, cursor)
        end = start + len(stripped)
        parts.append((stripped, start, end))
        cursor = end
    if not parts and normalized.strip():
        stripped = normalized.strip()
        parts.append((stripped, 0, len(stripped)))
    return parts


def _block_paragraph_units(
    blocks: tuple[ExtractionBlock, ...],
    full_text: str,
) -> list[RepresentationUnit]:
    if not blocks:
        return []
    units: list[RepresentationUnit] = []
    index = 0
    for block in blocks:
        body = block.text.strip()
        if not body:
            continue
        start = full_text.find(body)
        end = start + len(body) if start >= 0 else None
        units.append(
            RepresentationUnit(
                unit_index=index,
                kind="paragraph",
                text=body,
                page=block.page,
                x=block.x,
                y=block.y,
                width=block.width,
                height=block.height,
                char_start=start if start >= 0 else None,
                char_end=end,
            )
        )
        index += 1
    return units


def _table_row_units(
    content: bytes,
    mime_type: str,
    taco: TacoStageData,
    layout_pdf: LayoutIrDocument | None = None,
) -> list[RepresentationUnit]:
    if mime_type != "application/pdf" or not taco.tables:
        return []
    layout = layout_pdf
    if layout is None:
        try:
            from docuvate_worker.infrastructure.layout.extract import (  # noqa: PLC0415
                extract_layout_pdf_bytes,
            )
        except Exception:
            return []
        layout = extract_layout_pdf_bytes(content)
    if layout is None:
        return []
    units: list[RepresentationUnit] = []
    index_offset = 10_000
    table_index = 0
    for page in layout.pages:
        for table in page.tables:
            if table_index >= len(taco.tables):
                break
            meta = taco.tables[table_index]
            header_rows = max(meta.header_row_count, 1)
            header_text = " | ".join(
                cell.text.strip()
                for cell in table.rows[0]
                if cell.text.strip()
            ) if table.rows else ""
            for row_idx, row in enumerate(table.rows):
                if row_idx < header_rows:
                    continue
                row_text = " | ".join(cell.text.strip() for cell in row if cell.text.strip())
                if not row_text:
                    continue
                prefixed = f"{header_text}\t{row_text}" if header_text else row_text
                units.append(
                    RepresentationUnit(
                        unit_index=index_offset + table_index * 1000 + row_idx,
                        kind="table_row",
                        text=prefixed,
                        page=page.page,
                        x=None,
                        y=None,
                        width=None,
                        height=None,
                        char_start=None,
                        char_end=None,
                    )
                )
            table_index += 1
    return units


def build_representation_units(
    *,
    text: str,
    blocks: tuple[ExtractionBlock, ...],
    content: bytes,
    mime_type: str,
    luna: LunaStageData,
    taco: TacoStageData,
    layout_pdf: LayoutIrDocument | None = None,
) -> list[RepresentationUnit]:
    """Prefer block paragraphs and table rows; fall back to plain paragraph splits."""
    block_units = _block_paragraph_units(blocks, text)
    table_units = _table_row_units(content, mime_type, taco, layout_pdf)
    if block_units or table_units:
        merged = block_units + table_units
        return [
            RepresentationUnit(
                unit_index=idx,
                kind=unit.kind,
                text=unit.text,
                page=unit.page,
                x=unit.x,
                y=unit.y,
                width=unit.width,
                height=unit.height,
                char_start=unit.char_start,
                char_end=unit.char_end,
            )
            for idx, unit in enumerate(merged)
        ]
    paragraphs = paragraph_units_from_text(text)
    return [
        RepresentationUnit(
            unit_index=idx,
            kind="paragraph",
            text=body,
            page=None,
            x=None,
            y=None,
            width=None,
            height=None,
            char_start=start,
            char_end=end,
        )
        for idx, (body, start, end) in enumerate(paragraphs)
    ]


def append_sender_line_units(
    units: list[RepresentationUnit],
    text: str,
    *,
    max_lines: int = 64,
) -> list[RepresentationUnit]:
    """Add one encoding unit per non-empty line (for sender E5 reuse in the same embed batch)."""
    seen = {unit.text.strip() for unit in units if unit.text.strip()}
    extras: list[RepresentationUnit] = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped in seen:
            continue
        seen.add(stripped)
        extras.append(
            RepresentationUnit(
                unit_index=len(units) + len(extras),
                kind="sender_line",
                text=stripped,
                page=None,
                x=None,
                y=None,
                width=None,
                height=None,
                char_start=None,
                char_end=None,
            )
        )
        if len(extras) >= max_lines:
            break
    merged = units + extras
    return [
        RepresentationUnit(
            unit_index=idx,
            kind=unit.kind,
            text=unit.text,
            page=unit.page,
            x=unit.x,
            y=unit.y,
            width=unit.width,
            height=unit.height,
            char_start=unit.char_start,
            char_end=unit.char_end,
        )
        for idx, unit in enumerate(merged)
    ]
