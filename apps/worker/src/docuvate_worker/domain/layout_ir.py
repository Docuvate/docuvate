# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Layout intermediate representation (engine-neutral, versioned)."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any, Literal

LAYOUT_IR_VERSION: Literal[1] = 1


class TextAlign(StrEnum):
    LEFT = "left"
    CENTER = "center"
    RIGHT = "right"
    JUSTIFY = "justify"


class FontWeight(StrEnum):
    NORMAL = "normal"
    BOLD = "bold"


class LayoutIrCellRole(StrEnum):
    HEADER = "header"
    LABEL = "label"
    VALUE = "value"


class LayoutIrVectorKind(StrEnum):
    LINE = "line"
    RECT = "rect"
    PATH = "path"


class LayoutIrWidgetKind(StrEnum):
    TEXT = "text"
    CHECKBOX = "checkbox"


@dataclass(frozen=True)
class LayoutIrBlock:
    """Absolute positioned text span (typically one word)."""

    page: int
    x: float
    y: float
    width: float
    height: float
    text: str
    font_family: str | None = None
    font_size_pt: float | None = None
    weight: FontWeight = FontWeight.NORMAL
    align: TextAlign = TextAlign.LEFT
    column_index: int | None = None
    block_index: int | None = None
    rotation_deg: float | None = None
    matrix: tuple[float, float, float, float, float, float] | None = None
    text_rgb: tuple[float, float, float] | None = None
    text_origin_x: float | None = None
    text_origin_y: float | None = None


@dataclass(frozen=True)
class LayoutIrTableCell:
    text: str
    x: float
    y: float
    width: float
    height: float
    font_size_pt: float | None = None
    weight: FontWeight = FontWeight.NORMAL
    block_index: int | None = None
    cell_role: LayoutIrCellRole | None = None


@dataclass(frozen=True)
class LayoutIrTable:
    page: int
    x: float
    y: float
    width: float
    height: float
    rows: tuple[tuple[LayoutIrTableCell, ...], ...]
    column_count: int


@dataclass(frozen=True)
class LayoutIrLine:
    """Logical text line for re-render (no internal wrap)."""

    page: int
    x: float
    y: float
    width: float
    height: float
    text: str
    font_family: str | None = None
    font_size_pt: float | None = None
    weight: FontWeight = FontWeight.NORMAL
    align: TextAlign = TextAlign.LEFT
    block_index: int | None = None


@dataclass(frozen=True)
class LayoutIrVector:
    kind: LayoutIrVectorKind
    x: float
    y: float
    width: float
    height: float
    stroke_width_pt: float = 0.5
    filled: bool = False
    fill_gray: float | None = None
    fill_rgb: tuple[float, float, float] | None = None
    stroke_rgb: tuple[float, float, float] | None = None
    path_d: str | None = None


@dataclass(frozen=True)
class LayoutIrWidget:
    kind: LayoutIrWidgetKind
    page: int
    x: float
    y: float
    width: float
    height: float
    value: str = ""
    checked: bool | None = None
    field_name: str | None = None
    rotation_deg: float | None = None
    font_size_pt: float | None = None
    font_family: str | None = None
    align: TextAlign = TextAlign.LEFT
    """ZapfDingbats or appearance /MK /CA character when checkbox is checked."""
    check_mark: str | None = None


@dataclass(frozen=True)
class LayoutIrPage:
    page: int
    width_pt: float
    height_pt: float
    blocks: tuple[LayoutIrBlock, ...] = field(default_factory=tuple)
    lines: tuple[LayoutIrLine, ...] = field(default_factory=tuple)
    tables: tuple[LayoutIrTable, ...] = field(default_factory=tuple)
    vectors: tuple[LayoutIrVector, ...] = field(default_factory=tuple)
    widgets: tuple[LayoutIrWidget, ...] = field(default_factory=tuple)


@dataclass(frozen=True)
class LayoutIrDocument:
    version: Literal[1]
    pages: tuple[LayoutIrPage, ...] = field(default_factory=tuple)

    def to_json(self) -> dict[str, Any]:
        return layout_ir_document_to_json(self)


def layout_ir_block_to_json(block: LayoutIrBlock) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "page": block.page,
        "x": block.x,
        "y": block.y,
        "width": block.width,
        "height": block.height,
        "text": block.text,
        "weight": block.weight.value,
        "align": block.align.value,
    }
    if block.font_family is not None:
        payload["fontFamily"] = block.font_family
    if block.font_size_pt is not None:
        payload["fontSizePt"] = block.font_size_pt
    if block.column_index is not None:
        payload["columnIndex"] = block.column_index
    if block.block_index is not None:
        payload["blockIndex"] = block.block_index
    if block.rotation_deg is not None:
        payload["rotationDeg"] = block.rotation_deg
    if block.matrix is not None:
        payload["matrix"] = list(block.matrix)
    if block.text_rgb is not None:
        payload["textRgb"] = list(block.text_rgb)
    if block.text_origin_x is not None:
        payload["textOriginX"] = block.text_origin_x
    if block.text_origin_y is not None:
        payload["textOriginY"] = block.text_origin_y
    return payload


def layout_ir_table_cell_to_json(cell: LayoutIrTableCell) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "text": cell.text,
        "x": cell.x,
        "y": cell.y,
        "width": cell.width,
        "height": cell.height,
        "weight": cell.weight.value,
    }
    if cell.font_size_pt is not None:
        payload["fontSizePt"] = cell.font_size_pt
    if cell.block_index is not None:
        payload["blockIndex"] = cell.block_index
    if cell.cell_role is not None:
        payload["cellRole"] = cell.cell_role.value
    return payload


def layout_ir_line_to_json(line: LayoutIrLine) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "page": line.page,
        "x": line.x,
        "y": line.y,
        "width": line.width,
        "height": line.height,
        "text": line.text,
        "weight": line.weight.value,
        "align": line.align.value,
    }
    if line.font_family is not None:
        payload["fontFamily"] = line.font_family
    if line.font_size_pt is not None:
        payload["fontSizePt"] = line.font_size_pt
    if line.block_index is not None:
        payload["blockIndex"] = line.block_index
    return payload


def layout_ir_vector_to_json(vector: LayoutIrVector) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "kind": vector.kind.value,
        "x": vector.x,
        "y": vector.y,
        "width": vector.width,
        "height": vector.height,
        "strokeWidthPt": vector.stroke_width_pt,
        "filled": vector.filled,
    }
    if vector.fill_gray is not None:
        payload["fillGray"] = vector.fill_gray
    if vector.fill_rgb is not None:
        payload["fillRgb"] = list(vector.fill_rgb)
    if vector.stroke_rgb is not None:
        payload["strokeRgb"] = list(vector.stroke_rgb)
    if vector.path_d is not None:
        payload["pathD"] = vector.path_d
    return payload


def layout_ir_widget_to_json(widget: LayoutIrWidget) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "kind": widget.kind.value,
        "page": widget.page,
        "x": widget.x,
        "y": widget.y,
        "width": widget.width,
        "height": widget.height,
        "value": widget.value,
    }
    if widget.checked is not None:
        payload["checked"] = widget.checked
    if widget.field_name is not None:
        payload["fieldName"] = widget.field_name
    if widget.rotation_deg is not None:
        payload["rotationDeg"] = widget.rotation_deg
    if widget.font_size_pt is not None:
        payload["fontSizePt"] = widget.font_size_pt
    if widget.font_family is not None:
        payload["fontFamily"] = widget.font_family
    if widget.align != TextAlign.LEFT:
        payload["align"] = widget.align.value
    if widget.check_mark is not None:
        payload["checkMark"] = widget.check_mark
    return payload


def layout_ir_table_to_json(table: LayoutIrTable) -> dict[str, Any]:
    return {
        "page": table.page,
        "x": table.x,
        "y": table.y,
        "width": table.width,
        "height": table.height,
        "columnCount": table.column_count,
        "rows": [[layout_ir_table_cell_to_json(c) for c in row] for row in table.rows],
    }


def layout_ir_document_to_json(doc: LayoutIrDocument) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "version": doc.version,
        "pages": [
            {
                "page": page.page,
                "widthPt": page.width_pt,
                "heightPt": page.height_pt,
                "blocks": [layout_ir_block_to_json(b) for b in page.blocks],
                "lines": [layout_ir_line_to_json(ln) for ln in page.lines],
                "tables": [layout_ir_table_to_json(t) for t in page.tables],
                "vectors": [layout_ir_vector_to_json(v) for v in page.vectors],
                "widgets": [layout_ir_widget_to_json(w) for w in page.widgets],
            }
            for page in doc.pages
        ],
    }
    return payload
