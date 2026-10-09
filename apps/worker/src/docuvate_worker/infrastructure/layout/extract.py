# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Layout-aware PDF extraction: word spans + pdfplumber tables."""

from __future__ import annotations

import io
import logging
import re
from pathlib import Path

from docuvate_worker.domain.layout_ir import (
    LAYOUT_IR_VERSION,
    FontWeight,
    LayoutIrBlock,
    LayoutIrCellRole,
    LayoutIrDocument,
    LayoutIrPage,
    LayoutIrTable,
    LayoutIrTableCell,
    TextAlign,
)
from docuvate_worker.infrastructure.layout.acroform_extract import extract_acroform_widgets
from docuvate_worker.infrastructure.layout.checkbox_extract import extract_drawn_checkboxes
from docuvate_worker.infrastructure.layout.font_map import weight_from_fontname
from docuvate_worker.infrastructure.layout.layout_ir_limits import (
    MAX_LAYOUT_BLOCKS,
    MAX_LAYOUT_ELEMENTS,
    MAX_LAYOUT_LINES,
    MAX_LAYOUT_PAGES,
    MAX_LAYOUT_TABLES,
    MAX_LAYOUT_VECTORS,
    MAX_LAYOUT_WIDGETS,
)
from docuvate_worker.infrastructure.layout.line_cluster import cluster_blocks_into_lines
from docuvate_worker.infrastructure.layout.run_extract import extract_text_runs
from docuvate_worker.infrastructure.layout.vectors_extract import extract_vectors
from docuvate_worker.infrastructure.layout.widget_dedupe import (
    filter_duplicate_acroform_blocks,
    filter_redundant_text_widgets,
)

_WHITESPACE_RUN = re.compile(r"\s+")
_logger = logging.getLogger(__name__)

_TABLE_PAD_PT = 1.5


def _norm_box(
    x0: float, top: float, x1: float, bottom: float, page_width: float, page_height: float
) -> tuple[float, float, float, float]:
    return (
        x0 / page_width,
        top / page_height,
        max(0.0, (x1 - x0) / page_width),
        max(0.0, (bottom - top) / page_height),
    )


def _point_in_box(px: float, py: float, x0: float, top: float, x1: float, bottom: float) -> bool:
    return x0 <= px <= x1 and top <= py <= bottom


def _word_center(word: dict) -> tuple[float, float]:
    x0 = float(word["x0"])
    x1 = float(word["x1"])
    top = float(word["top"])
    bottom = float(word["bottom"])
    return (x0 + x1) / 2, (top + bottom) / 2


def _chars_in_box(page, x0: float, top: float, x1: float, bottom: float) -> list[dict]:
    out: list[dict] = []
    for char in page.chars or []:
        cx = (float(char["x0"]) + float(char["x1"])) / 2
        cy = (float(char["top"]) + float(char["bottom"])) / 2
        if _point_in_box(cx, cy, x0, top, x1, bottom):
            out.append(char)
    return out


def _style_from_chars(chars: list[dict]) -> tuple[float | None, FontWeight, str | None]:
    if not chars:
        return None, FontWeight.NORMAL, None
    sizes = [float(c["size"]) for c in chars if c.get("size")]
    fontnames = [c.get("fontname") for c in chars if c.get("fontname")]
    size_pt = sum(sizes) / len(sizes) if sizes else None
    fontname = str(fontnames[0]) if fontnames else None
    return size_pt, weight_from_fontname(fontname), fontname


def _infer_cell_role(chars: list[dict], weight: FontWeight) -> LayoutIrCellRole | None:
    if weight == FontWeight.BOLD:
        return LayoutIrCellRole.HEADER
    for char in chars:
        color = char.get("non_stroking_color")
        if isinstance(color, (list, tuple)) and len(color) >= 3:
            r, g, b = float(color[0]), float(color[1]), float(color[2])
            if r > 0.85 and g > 0.85 and b > 0.85 and max(r, g, b) - min(r, g, b) < 0.08:
                return LayoutIrCellRole.VALUE
    return LayoutIrCellRole.LABEL


def _cell_role_for(
    col_idx: int, col_count: int, weight: FontWeight, chars: list[dict]
) -> LayoutIrCellRole | None:
    role = _infer_cell_role(chars, weight)
    if role == LayoutIrCellRole.HEADER:
        return role
    if col_count == 2 and col_idx == 1:
        return LayoutIrCellRole.VALUE
    if col_count == 2 and col_idx == 0:
        return LayoutIrCellRole.LABEL
    return role


def _extract_tables(
    page, page_num: int, page_width: float, page_height: float
) -> list[LayoutIrTable]:
    tables: list[LayoutIrTable] = []
    found = page.find_tables(
        {
            "vertical_strategy": "lines",
            "horizontal_strategy": "lines",
            "intersection_tolerance": 5,
        }
    )
    if not found:
        found = page.find_tables()

    for table in found:
        if not table.rows:
            continue
        x0, top, x1, bottom = table.bbox
        nx, ny, nw, nh = _norm_box(x0, top, x1, bottom, page_width, page_height)
        row_cells: list[tuple[LayoutIrTableCell, ...]] = []
        max_cols = 0
        extracted = table.extract() or []

        for row_idx, row in enumerate(table.rows):
            cells: list[LayoutIrTableCell] = []
            for col_idx, cell in enumerate(row.cells):
                if cell is None:
                    continue
                cx0, ctop, cx1, cbottom = cell
                chars = _chars_in_box(page, cx0, ctop, cx1, cbottom)
                size_pt, weight, _font = _style_from_chars(chars)
                text = ""
                if row_idx < len(extracted) and col_idx < len(extracted[row_idx]):
                    text = (extracted[row_idx][col_idx] or "").strip()
                if not text and chars:
                    ordered = sorted(chars, key=lambda c: (c["top"], c["x0"]))
                    text = "".join(c.get("text") or "" for c in ordered)
                    text = _WHITESPACE_RUN.sub(" ", text).strip()
                if not text:
                    continue
                col_count = len(row.cells)
                cell_role = _cell_role_for(col_idx, col_count, weight, chars)
                bx, by, bw, bh = _norm_box(cx0, ctop, cx1, cbottom, page_width, page_height)
                cells.append(
                    LayoutIrTableCell(
                        text=text,
                        x=bx,
                        y=by,
                        width=bw,
                        height=bh,
                        font_size_pt=size_pt,
                        weight=weight,
                        cell_role=cell_role,
                    )
                )
            if cells:
                row_cells.append(tuple(cells))
                max_cols = max(max_cols, len(cells))

        if row_cells:
            tables.append(
                LayoutIrTable(
                    page=page_num,
                    x=nx,
                    y=ny,
                    width=nw,
                    height=nh,
                    rows=tuple(row_cells),
                    column_count=max_cols,
                )
            )
    return tables


def _table_regions(
    tables: list[LayoutIrTable], page_width: float, page_height: float
) -> list[tuple[float, float, float, float]]:
    regions: list[tuple[float, float, float, float]] = []
    for table in tables:
        x0 = table.x * page_width - _TABLE_PAD_PT
        y0 = table.y * page_height - _TABLE_PAD_PT
        x1 = (table.x + table.width) * page_width + _TABLE_PAD_PT
        y1 = (table.y + table.height) * page_height + _TABLE_PAD_PT
        regions.append((x0, y0, x1, y1))
    return regions


def _block_iou(a: LayoutIrBlock, b: LayoutIrBlock) -> float:
    x0 = max(a.x, b.x)
    y0 = max(a.y, b.y)
    x1 = min(a.x + a.width, b.x + b.width)
    y1 = min(a.y + a.height, b.y + b.height)
    if x1 <= x0 or y1 <= y0:
        return 0.0
    inter = (x1 - x0) * (y1 - y0)
    union = a.width * a.height + b.width * b.height - inter
    if union <= 0:
        return 0.0
    return inter / union


def _dedupe_overlapping_run_blocks(blocks: list[LayoutIrBlock]) -> list[LayoutIrBlock]:
    """Drop smaller duplicate runs on the same PDF text (e.g. SEPA title 8pt over 12pt)."""
    ordered = sorted(
        blocks,
        key=lambda b: (-(b.font_size_pt or 0.0), -(b.width * b.height)),
    )
    kept: list[LayoutIrBlock] = []
    for block in ordered:
        text = block.text.strip()
        if not text:
            continue
        duplicate = False
        for other in kept:
            if other.text.strip() != text:
                continue
            if _block_iou(block, other) >= 0.25:
                duplicate = True
                break
        if not duplicate:
            kept.append(block)
    kept.sort(key=lambda b: b.block_index if b.block_index is not None else 0)
    return kept


def _word_in_regions(word: dict, regions: list[tuple[float, float, float, float]]) -> bool:
    cx, cy = _word_center(word)
    for x0, top, x1, bottom in regions:
        if _point_in_box(cx, cy, x0, top, x1, bottom):
            return True
    return False


def _word_to_span(
    word: dict, page_num: int, page_width: float, page_height: float, block_index: int
) -> LayoutIrBlock | None:
    text = (word.get("text") or "").strip()
    if not text:
        return None
    x0 = float(word["x0"])
    x1 = float(word["x1"])
    top = float(word["top"])
    bottom = float(word["bottom"])
    fontname = word.get("fontname")
    size_raw = word.get("size")
    size_pt = float(size_raw) if size_raw is not None else None
    nx, ny, nw, nh = _norm_box(x0, top, x1, bottom, page_width, page_height)
    return LayoutIrBlock(
        page=page_num,
        x=nx,
        y=ny,
        width=nw,
        height=nh,
        text=text,
        font_family=str(fontname) if fontname else None,
        font_size_pt=size_pt,
        weight=weight_from_fontname(str(fontname) if fontname else None),
        align=TextAlign.LEFT,
        block_index=block_index,
    )


def extract_layout_pdf_bytes(content: bytes) -> LayoutIrDocument | None:
    import pdfplumber

    pages: list[LayoutIrPage] = []
    block_index = 0
    total_blocks = 0
    total_lines = 0
    total_tables = 0
    total_vectors = 0
    total_widgets = 0
    truncated = False
    acroform_widgets = extract_acroform_widgets(content)
    widgets_by_page: dict[int, list] = {}
    for widget in acroform_widgets:
        widgets_by_page.setdefault(widget.page, []).append(widget)

    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            if len(pages) >= MAX_LAYOUT_PAGES:
                truncated = True
                break
            page_width = float(page.width or 612)
            page_height = float(page.height or 792)
            if page_width <= 0 or page_height <= 0:
                continue

            ir_tables = _extract_tables(page, page_num, page_width, page_height)

            spans, block_index = extract_text_runs(
                page,
                page_num,
                page_width,
                page_height,
                start_block_index=block_index,
            )
            spans = _dedupe_overlapping_run_blocks(spans)

            if not spans and not ir_tables:
                plain = (page.extract_text() or "").strip()
                if not plain:
                    continue
                spans.append(
                    LayoutIrBlock(
                        page=page_num,
                        x=0.05,
                        y=0.05,
                        width=0.9,
                        height=0.08,
                        text=plain[:400],
                        block_index=block_index,
                    )
                )
                block_index += 1

            def _upright(block: LayoutIrBlock) -> bool:
                if block.matrix is not None:
                    return abs(block.matrix[1]) < 0.05 and abs(block.matrix[2]) < 0.05
                return block.rotation_deg is None

            upright_spans = [s for s in spans if _upright(s)]
            lines = cluster_blocks_into_lines(list(upright_spans), page_width_pt=page_width)
            vectors = extract_vectors(page, page_width, page_height)
            page_widgets = list(widgets_by_page.get(page_num, []))
            page_widgets.extend(
                extract_drawn_checkboxes(page, vectors, page_num, page_width, page_height)
            )
            spans = filter_duplicate_acroform_blocks(spans, page_widgets)
            page_widgets = filter_redundant_text_widgets(spans, page_widgets)

            block_budget = MAX_LAYOUT_BLOCKS - total_blocks
            if block_budget <= 0:
                truncated = True
                spans = ()
            elif len(spans) > block_budget:
                truncated = True
                spans = spans[:block_budget]

            line_budget = MAX_LAYOUT_LINES - total_lines
            if line_budget <= 0:
                lines = ()
            elif len(lines) > line_budget:
                truncated = True
                lines = lines[:line_budget]

            table_budget = MAX_LAYOUT_TABLES - total_tables
            if table_budget <= 0:
                ir_tables = ()
            elif len(ir_tables) > table_budget:
                truncated = True
                ir_tables = ir_tables[:table_budget]

            vector_budget = MAX_LAYOUT_VECTORS - total_vectors
            if vector_budget <= 0:
                vectors = ()
            elif len(vectors) > vector_budget:
                truncated = True
                vectors = vectors[:vector_budget]

            widget_budget = MAX_LAYOUT_WIDGETS - total_widgets
            if widget_budget <= 0:
                page_widgets = []
            elif len(page_widgets) > widget_budget:
                truncated = True
                page_widgets = page_widgets[:widget_budget]

            element_count = (
                len(spans) + len(lines) + len(ir_tables) + len(vectors) + len(page_widgets)
            )
            running_total = (
                total_blocks
                + total_lines
                + total_tables
                + total_vectors
                + total_widgets
                + element_count
            )
            if running_total > MAX_LAYOUT_ELEMENTS:
                truncated = True
                break

            total_blocks += len(spans)
            total_lines += len(lines)
            total_tables += len(ir_tables)
            total_vectors += len(vectors)
            total_widgets += len(page_widgets)

            pages.append(
                LayoutIrPage(
                    page=page_num,
                    width_pt=page_width,
                    height_pt=page_height,
                    blocks=tuple(spans),
                    lines=tuple(lines),
                    tables=tuple(ir_tables),
                    vectors=tuple(vectors),
                    widgets=tuple(page_widgets),
                )
            )

    if truncated:
        _logger.warning("layout IR extraction truncated to element limits")
    if not pages:
        return None
    return LayoutIrDocument(version=LAYOUT_IR_VERSION, pages=tuple(pages))


def extract_layout_pdf_path(path: Path) -> LayoutIrDocument | None:
    return extract_layout_pdf_bytes(path.read_bytes())
