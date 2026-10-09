# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Parse layout IR JSON (camelCase API) into domain dataclasses."""

from __future__ import annotations

from typing import Any

from docuvate_worker.domain.layout_ir import (
    LayoutIrBlock,
    LayoutIrDocument,
    LayoutIrLine,
    LayoutIrPage,
    LayoutIrTable,
    LayoutIrTableCell,
    LayoutIrVector,
    LayoutIrWidget,
)
from docuvate_worker.infrastructure.layout.layout_ir_validate import (
    _align,
    _cell_role,
    _check_mark,
    _finite_float,
    _matrix_six,
    _optional_finite_float,
    _optional_int,
    _require_key,
    _rgb_triple,
    _vector_kind,
    _weight,
    _widget_kind,
)


def document_from_dict(raw: dict[str, Any]) -> LayoutIrDocument:
    version = _optional_int(raw.get("version"), "version")
    if version != 1:
        raise ValueError("version must be 1")
    pages: list[LayoutIrPage] = []
    seen_page_numbers: set[int] = set()
    for page_raw in raw.get("pages") or []:
        if not isinstance(page_raw, dict):
            raise ValueError("page must be an object")
        page_num = _optional_int(_require_key(page_raw, "page"), "page")
        if page_num is None:
            raise ValueError("page must be an integer")
        if page_num in seen_page_numbers:
            raise ValueError(f"duplicate page number {page_num}")
        seen_page_numbers.add(page_num)
        width_pt = _finite_float(_require_key(page_raw, "widthPt"), "widthPt")
        height_pt = _finite_float(_require_key(page_raw, "heightPt"), "heightPt")
        blocks = tuple(_parse_block(b, page_num) for b in page_raw.get("blocks") or [])
        lines = tuple(_parse_line(ln, page_num) for ln in page_raw.get("lines") or [])
        tables = tuple(_parse_table(t, page_num) for t in page_raw.get("tables") or [])
        vectors = tuple(_parse_vector(v) for v in page_raw.get("vectors") or [])
        widgets = tuple(_parse_widget(w, page_num) for w in page_raw.get("widgets") or [])
        pages.append(
            LayoutIrPage(
                page=page_num,
                width_pt=width_pt,
                height_pt=height_pt,
                blocks=blocks,
                lines=lines,
                tables=tables,
                vectors=vectors,
                widgets=widgets,
            )
        )
    return LayoutIrDocument(version=1, pages=tuple(pages))


def _parse_block(b: Any, default_page: int) -> LayoutIrBlock:
    if not isinstance(b, dict):
        raise ValueError("block must be an object")
    page = _optional_int(b.get("page"), "page") or default_page
    matrix_raw = b.get("matrix")
    text_rgb_raw = b.get("textRgb")
    return LayoutIrBlock(
        page=page,
        x=_finite_float(_require_key(b, "x"), "x"),
        y=_finite_float(_require_key(b, "y"), "y"),
        width=_finite_float(_require_key(b, "width"), "width"),
        height=_finite_float(_require_key(b, "height"), "height"),
        text=str(b.get("text") or ""),
        font_family=b.get("fontFamily") if b.get("fontFamily") is None else str(b["fontFamily"]),
        font_size_pt=_optional_finite_float(b.get("fontSizePt"), "fontSizePt"),
        weight=_weight(b.get("weight")),
        align=_align(b.get("align")),
        column_index=_optional_int(b.get("columnIndex"), "columnIndex"),
        block_index=_optional_int(b.get("blockIndex"), "blockIndex"),
        rotation_deg=_optional_finite_float(b.get("rotationDeg"), "rotationDeg"),
        matrix=_matrix_six(matrix_raw, "matrix") if matrix_raw is not None else None,
        text_rgb=_rgb_triple(text_rgb_raw, "textRgb") if text_rgb_raw is not None else None,
        text_origin_x=_optional_finite_float(b.get("textOriginX"), "textOriginX"),
        text_origin_y=_optional_finite_float(b.get("textOriginY"), "textOriginY"),
    )


def _parse_line(ln: Any, default_page: int) -> LayoutIrLine:
    if not isinstance(ln, dict):
        raise ValueError("line must be an object")
    page = _optional_int(ln.get("page"), "page") or default_page
    return LayoutIrLine(
        page=page,
        x=_finite_float(_require_key(ln, "x"), "x"),
        y=_finite_float(_require_key(ln, "y"), "y"),
        width=_finite_float(_require_key(ln, "width"), "width"),
        height=_finite_float(_require_key(ln, "height"), "height"),
        text=str(ln.get("text") or ""),
        font_family=ln.get("fontFamily") if ln.get("fontFamily") is None else str(ln["fontFamily"]),
        font_size_pt=_optional_finite_float(ln.get("fontSizePt"), "fontSizePt"),
        weight=_weight(ln.get("weight")),
        align=_align(ln.get("align")),
        block_index=_optional_int(ln.get("blockIndex"), "blockIndex"),
    )


def _parse_table(table_raw: Any, default_page: int) -> LayoutIrTable:
    if not isinstance(table_raw, dict):
        raise ValueError("table must be an object")
    page = _optional_int(table_raw.get("page"), "page") or default_page
    rows: list[tuple[LayoutIrTableCell, ...]] = []
    for row in table_raw.get("rows") or []:
        if not isinstance(row, list):
            raise ValueError("table row must be an array")
        cells: list[LayoutIrTableCell] = []
        for cell in row:
            if not isinstance(cell, dict):
                raise ValueError("table cell must be an object")
            cells.append(
                LayoutIrTableCell(
                    text=str(cell.get("text") or ""),
                    x=_finite_float(_require_key(cell, "x"), "x"),
                    y=_finite_float(_require_key(cell, "y"), "y"),
                    width=_finite_float(_require_key(cell, "width"), "width"),
                    height=_finite_float(_require_key(cell, "height"), "height"),
                    font_size_pt=_optional_finite_float(cell.get("fontSizePt"), "fontSizePt"),
                    weight=_weight(cell.get("weight")),
                    block_index=_optional_int(cell.get("blockIndex"), "blockIndex"),
                    cell_role=_cell_role(cell.get("cellRole")),
                )
            )
        rows.append(tuple(cells))
    column_count = _optional_int(table_raw.get("columnCount"), "columnCount")
    if column_count is None:
        column_count = 1
    return LayoutIrTable(
        page=page,
        x=_finite_float(_require_key(table_raw, "x"), "x"),
        y=_finite_float(_require_key(table_raw, "y"), "y"),
        width=_finite_float(_require_key(table_raw, "width"), "width"),
        height=_finite_float(_require_key(table_raw, "height"), "height"),
        rows=tuple(rows),
        column_count=column_count,
    )


def _parse_vector(v: Any) -> LayoutIrVector:
    if not isinstance(v, dict):
        raise ValueError("vector must be an object")
    fill_rgb_raw = v.get("fillRgb")
    stroke_rgb_raw = v.get("strokeRgb")
    return LayoutIrVector(
        kind=_vector_kind(v.get("kind")),
        x=_finite_float(_require_key(v, "x"), "x"),
        y=_finite_float(_require_key(v, "y"), "y"),
        width=_finite_float(_require_key(v, "width"), "width"),
        height=_finite_float(_require_key(v, "height"), "height"),
        stroke_width_pt=_finite_float(v.get("strokeWidthPt", 0.5), "strokeWidthPt"),
        filled=bool(v.get("filled")),
        fill_gray=_optional_finite_float(v.get("fillGray"), "fillGray"),
        fill_rgb=_rgb_triple(fill_rgb_raw, "fillRgb") if fill_rgb_raw is not None else None,
        stroke_rgb=_rgb_triple(stroke_rgb_raw, "strokeRgb") if stroke_rgb_raw is not None else None,
        path_d=v.get("pathD") if v.get("pathD") is None else str(v["pathD"]),
    )


def _parse_widget(w: Any, default_page: int) -> LayoutIrWidget:
    if not isinstance(w, dict):
        raise ValueError("widget must be an object")
    page = _optional_int(w.get("page"), "page") or default_page
    checked = w.get("checked")
    if checked is not None and not isinstance(checked, bool):
        raise ValueError("checked must be a boolean")
    return LayoutIrWidget(
        kind=_widget_kind(w.get("kind")),
        page=page,
        x=_finite_float(_require_key(w, "x"), "x"),
        y=_finite_float(_require_key(w, "y"), "y"),
        width=_finite_float(_require_key(w, "width"), "width"),
        height=_finite_float(_require_key(w, "height"), "height"),
        value=str(w.get("value") or ""),
        checked=checked,
        field_name=w.get("fieldName") if w.get("fieldName") is None else str(w["fieldName"]),
        rotation_deg=_optional_finite_float(w.get("rotationDeg"), "rotationDeg"),
        font_size_pt=_optional_finite_float(w.get("fontSizePt"), "fontSizePt"),
        font_family=w.get("fontFamily") if w.get("fontFamily") is None else str(w["fontFamily"]),
        align=_align(w.get("align")),
        check_mark=_check_mark(w.get("checkMark")),
    )
