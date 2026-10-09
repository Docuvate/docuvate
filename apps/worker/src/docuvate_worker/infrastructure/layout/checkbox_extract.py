"""Detect drawn checkbox squares and diagonal marks from pdfplumber geometry."""

from __future__ import annotations

from docuvate_worker.domain.layout_ir import (
    LayoutIrVector,
    LayoutIrVectorKind,
    LayoutIrWidget,
    LayoutIrWidgetKind,
)


def _point_in_norm(px: float, py: float, x: float, y: float, w: float, h: float) -> bool:
    return x <= px <= x + w and y <= py <= y + h


def extract_drawn_checkboxes(
    page,
    vectors: list[LayoutIrVector],
    page_num: int,
    page_width: float,
    page_height: float,
) -> list[LayoutIrWidget]:
    if page_width <= 0 or page_height <= 0:
        return []

    squares: list[LayoutIrVector] = []
    for vector in vectors:
        if vector.kind != LayoutIrVectorKind.RECT:
            continue
        w_pt = vector.width * page_width
        h_pt = vector.height * page_height
        if 2.5 <= w_pt <= 14.0 and 2.5 <= h_pt <= 14.0 and abs(w_pt - h_pt) < 2.5:
            squares.append(vector)

    edges = page.edges or []
    widgets: list[LayoutIrWidget] = []
    for square in squares:
        sx0 = square.x * page_width
        sy0 = square.y * page_height
        sx1 = sx0 + square.width * page_width
        sy1 = sy0 + square.height * page_height
        stroke_inside = 0
        for edge in edges:
            cx = (float(edge["x0"]) + float(edge["x1"])) / 2
            cy = (float(edge["top"]) + float(edge["bottom"])) / 2
            if sx0 <= cx <= sx1 and sy0 <= cy <= sy1:
                length = (
                    (float(edge["x1"]) - float(edge["x0"])) ** 2
                    + (float(edge["bottom"]) - float(edge["top"])) ** 2
                ) ** 0.5
                if length >= 1.5:
                    stroke_inside += 1
        checked = stroke_inside >= 5
        widgets.append(
            LayoutIrWidget(
                kind=LayoutIrWidgetKind.CHECKBOX,
                page=page_num,
                x=square.x,
                y=square.y,
                width=square.width,
                height=square.height,
                checked=checked,
            )
        )
    return widgets
