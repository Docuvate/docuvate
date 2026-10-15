# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Build a per-document fact index from layout-aware text (structural rules only)."""

from __future__ import annotations

import re
import time
from typing import TYPE_CHECKING

from docuvate_worker.domain.exact_fact_index.types import (
    ExtractedFact,
    FactIndexBuildResult,
    FactProvenance,
)
from docuvate_worker.domain.exact_fact_index.value_transducers import (
    classify_typed_value,
    normalize_predicate_key,
)
from docuvate_worker.domain.layout_ir import LayoutIrDocument
from docuvate_worker.domain.models import ExtractionBlock

if TYPE_CHECKING:
    from docuvate_worker.domain.cpu_pipeline.contracts import TacoStageData

_KV_LINE = re.compile(r"^(.{1,120}?)\s*[:|\t]\s*(.+)$")
_MAX_FACTS = 10_000


def _provenance_from_block(
    block: ExtractionBlock | None,
    char_start: int | None,
    char_end: int | None,
) -> FactProvenance:
    if block is None:
        return FactProvenance(
            page=None,
            x=None,
            y=None,
            width=None,
            height=None,
            char_start=char_start,
            char_end=char_end,
        )
    return FactProvenance(
        page=block.page,
        x=block.x,
        y=block.y,
        width=block.width,
        height=block.height,
        char_start=char_start,
        char_end=char_end,
    )


def _find_block_for_span(
    full_text: str,
    blocks: tuple[ExtractionBlock, ...],
    char_start: int,
    char_end: int,
) -> ExtractionBlock | None:
    snippet = full_text[char_start:char_end].strip()
    if snippet:
        for block in blocks:
            body = block.text.strip()
            if body and (body in snippet or snippet in body):
                return block
    for block in blocks:
        body = block.text.strip()
        if not body:
            continue
        pos = full_text.find(body)
        if pos >= 0 and pos <= char_start <= pos + len(body):
            return block
    return blocks[0] if blocks else None


def _line_span(full_text: str, line: str, search_from: int) -> tuple[int, int]:
    idx = full_text.find(line, search_from)
    if idx < 0:
        idx = full_text.find(line.strip(), search_from)
    if idx < 0:
        return (search_from, search_from + len(line))
    return (idx, idx + len(line))


def _append_fact(
    out: list[ExtractedFact],
    fact: ExtractedFact,
) -> None:
    if len(out) >= _MAX_FACTS:
        return
    out.append(fact)


def _fact_from_kv(
    predicate_raw: str,
    value_raw: str,
    provenance: FactProvenance,
    *,
    table_index: int | None = None,
    row_index: int | None = None,
    col_index: int | None = None,
) -> ExtractedFact:
    predicate_key = normalize_predicate_key(predicate_raw)
    kind_hint, amount, iso_date = classify_typed_value(value_raw.strip())
    confidence = 0.75
    if kind_hint == "amount" and amount is not None:
        return ExtractedFact(
            kind="amount",
            predicate_key=predicate_key,
            confidence=confidence,
            provenance=provenance,
            amount_numeric=amount.amount,
            currency_code=amount.currency_code,
            table_index=table_index,
            row_index=row_index,
            col_index=col_index,
        )
    if kind_hint == "date" and iso_date is not None:
        return ExtractedFact(
            kind="date",
            predicate_key=predicate_key,
            confidence=confidence,
            provenance=provenance,
            value_date_iso=iso_date,
            table_index=table_index,
            row_index=row_index,
            col_index=col_index,
        )
    return ExtractedFact(
        kind="key_value" if table_index is None else "table_cell",
        predicate_key=predicate_key,
        confidence=confidence,
        provenance=provenance,
        value_text=value_raw.strip(),
        table_index=table_index,
        row_index=row_index,
        col_index=col_index,
    )


def _extract_key_value_lines(
    full_text: str,
    blocks: tuple[ExtractionBlock, ...],
) -> list[ExtractedFact]:
    facts: list[ExtractedFact] = []
    cursor = 0
    for raw_line in full_text.splitlines():
        line = raw_line.strip()
        if not line:
            cursor += len(raw_line) + 1
            continue
        match = _KV_LINE.match(line)
        if not match:
            cursor += len(raw_line) + 1
            continue
        key = match.group(1).strip()
        value = match.group(2).strip()
        if not key or not value:
            cursor += len(raw_line) + 1
            continue
        char_start, char_end = _line_span(full_text, line, cursor)
        block = _find_block_for_span(full_text, blocks, char_start, char_end)
        provenance = _provenance_from_block(block, char_start, char_end)
        _append_fact(facts, _fact_from_kv(key, value, provenance))
        cursor += len(raw_line) + 1
    return facts


def _extract_table_facts(
    content: bytes,
    mime_type: str,
    taco: TacoStageData,
    layout_pdf: LayoutIrDocument | None = None,
) -> list[ExtractedFact]:
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
    facts: list[ExtractedFact] = []
    table_index = 0
    for page in layout.pages:
        for table in page.tables:
            if table_index >= len(taco.tables):
                break
            if not table.rows:
                continue
            header_cells = table.rows[0]
            headers = [normalize_predicate_key(cell.text) for cell in header_cells]
            for row_index, row in enumerate(table.rows[1:], start=1):
                for col_index, cell in enumerate(row):
                    value = cell.text.strip()
                    if not value:
                        continue
                    if col_index < len(headers):
                        header = headers[col_index]
                    else:
                        header = f"column_{col_index}"
                    if not header:
                        header = f"column_{col_index}"
                    provenance = FactProvenance(
                        page=page.page,
                        x=cell.x,
                        y=cell.y,
                        width=cell.width,
                        height=cell.height,
                        char_start=None,
                        char_end=None,
                    )
                    _append_fact(
                        facts,
                        _fact_from_kv(
                            header,
                            value,
                            provenance,
                            table_index=table_index,
                            row_index=row_index,
                            col_index=col_index,
                        ),
                    )
            table_index += 1
    return facts


def build_exact_fact_index(
    *,
    text: str,
    blocks: tuple[ExtractionBlock, ...],
    content: bytes,
    mime_type: str,
    taco: TacoStageData,
    layout_pdf: LayoutIrDocument | None = None,
) -> FactIndexBuildResult:
    started = time.perf_counter()
    merged: list[ExtractedFact] = []
    for fact in _extract_key_value_lines(text, blocks):
        _append_fact(merged, fact)
    for fact in _extract_table_facts(content, mime_type, taco, layout_pdf):
        _append_fact(merged, fact)
    elapsed_ms = (time.perf_counter() - started) * 1000.0
    return FactIndexBuildResult(facts=tuple(merged), wall_time_ms=elapsed_ms)
