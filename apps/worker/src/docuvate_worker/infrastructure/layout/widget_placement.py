# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Shared AcroForm widget text placement (alignment + vertical centering)."""

from __future__ import annotations

from docuvate_worker.domain.layout_ir import LayoutIrWidget, TextAlign
from docuvate_worker.infrastructure.layout.font_map import font_ascent_em


def widget_text_origin_pt(
    widget: LayoutIrWidget,
    *,
    page_width_pt: float,
    page_height_pt: float,
    font_size_pt: float,
    line_index: int,
    line_count: int,
) -> tuple[float, float, float]:
    x = widget.x * page_width_pt
    y = widget.y * page_height_pt
    w = max(widget.width * page_width_pt, 4.0)
    h = max(widget.height * page_height_pt, 4.0)
    pad = 2.0
    ascent = font_size_pt * font_ascent_em(widget.font_family)
    descent = font_size_pt * 0.22
    text_h = ascent + descent
    if line_count <= 1:
        # Cap height below field top (avoids overlap with in-box labels).
        y_line = y + min(max(font_size_pt * 0.72, pad), max(pad, h - text_h))
    else:
        line_step = font_size_pt * 1.15
        y_line = y + pad + line_index * line_step
    return x + pad, y_line, max(w - 2 * pad, 4.0)


def typst_align_in_box(widget: LayoutIrWidget) -> str:
    if widget.align == TextAlign.CENTER:
        return "center"
    if widget.align == TextAlign.RIGHT:
        return "right"
    return "left"


def css_text_align(widget: LayoutIrWidget) -> str:
    return widget.align.value
