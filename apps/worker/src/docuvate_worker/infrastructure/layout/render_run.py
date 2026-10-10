# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Shared run placement helpers for HTML and Typst fidelity renderers."""

from __future__ import annotations

import math

from docuvate_worker.domain.layout_ir import FontWeight, LayoutIrBlock, LayoutIrPage
from docuvate_worker.infrastructure.layout.font_map import (
    is_italic_fontname,
    typst_font_and_scale,
    uses_metric_typst_substitute,
)
from docuvate_worker.infrastructure.layout.text_fit import (
    horizontal_scale_factor,
    measured_text_width_pt,
)


def _is_rotated_block(block: LayoutIrBlock) -> bool:
    if block.matrix is None:
        return block.rotation_deg is not None and abs(block.rotation_deg) >= 5.0  # noqa: PLR2004
    _a, b, _, _d, _, _ = block.matrix
    if abs(b) >= 0.05 or abs(block.matrix[2]) >= 0.05:  # noqa: PLR2004
        return True
    return block.rotation_deg is not None and abs(block.rotation_deg) >= 5.0  # noqa: PLR2004


def _matrix_scale(matrix: tuple[float, float, float, float, float, float]) -> float:
    a, b, _, _, _, _ = matrix
    scale = math.hypot(a, b)
    return scale if scale > 0.01 else 1.0  # noqa: PLR2004


def run_font_size_pt(block: LayoutIrBlock) -> float:
    base = block.font_size_pt or 11.0
    _, scale = typst_font_and_scale(block.font_family)
    return base * scale


def run_scale_x(
    block: LayoutIrBlock,
    page: LayoutIrPage,
    measured: dict[int, float] | None = None,
) -> float:
    if measured is not None and block.block_index is not None:
        if block.block_index in measured:
            return measured[block.block_index]
        return 1.0
    if uses_metric_typst_substitute(block.font_family):
        return 1.0
    target = block.width * page.width_pt
    size = run_font_size_pt(block)
    family, _ = typst_font_and_scale(block.font_family)
    measured = measured_text_width_pt(
        block.text,
        size,
        family,
        bold=block.weight == FontWeight.BOLD,
    )
    if measured is not None and measured > 0 and target > 0:
        return horizontal_scale_factor(
            block.text,
            size,
            target,
            bold=block.weight == FontWeight.BOLD,
            estimated_width_pt=measured,
        )
    estimated = len(block.text.rstrip()) * size * 0.48
    if target <= 0 or estimated <= 0:
        return 1.0
    return horizontal_scale_factor(
        block.text,
        size,
        target,
        bold=block.weight == FontWeight.BOLD,
    )


def run_font_weight_css(block: LayoutIrBlock) -> int:
    return 700 if block.weight == FontWeight.BOLD else 400


def run_anchor_pt(
    block: LayoutIrBlock,
    page: LayoutIrPage,
    *,
    baseline_origin: bool = False,
) -> tuple[float, float]:
    """Placement point in pdfplumber top-down pt space."""
    pw, ph = page.width_pt, page.height_pt
    if block.text_origin_x is not None and block.text_origin_y is not None:
        baseline_x = block.text_origin_x * pw
        baseline_y = block.text_origin_y * ph
    elif block.matrix is not None:
        _a, _b, _c, _d, e, f = block.matrix
        baseline_x = float(e)
        baseline_y = ph - float(f)
    else:
        baseline_x = block.x * pw
        baseline_y = (block.y + block.height) * ph

    if _is_rotated_block(block) or baseline_origin:
        return baseline_x, baseline_y
    # Upright HTML: pdfplumber char bbox top aligns with pdf2image raster better than ascent.
    top_y = block.y * ph
    left_x = block.x * pw
    return left_x, top_y


def css_run_transform(block: LayoutIrBlock, scale_x: float) -> str:
    parts: list[str] = []
    if block.matrix is not None and _is_rotated_block(block):
        a, b, c, d, _, _ = block.matrix
        scale = _matrix_scale(block.matrix)
        na, nb, nc, nd = a / scale, b / scale, c / scale, d / scale
        parts.append(f"matrix({na:.6f},{-nb:.6f},{-nc:.6f},{nd:.6f},0,0)")
    elif block.rotation_deg is not None and abs(block.rotation_deg) >= 0.5:  # noqa: PLR2004
        parts.append(f"rotate({block.rotation_deg:.4f}deg)")
    if abs(scale_x - 1.0) > 0.008:  # noqa: PLR2004
        parts.append(f"scaleX({scale_x:.4f})")
    if not parts:
        return ""
    origin = "0 0" if _is_rotated_block(block) else "left top"
    return f"transform:{' '.join(parts)};transform-origin:{origin};"


def css_run_color(block: LayoutIrBlock) -> str:
    if block.text_rgb is None:
        return ""
    r, g, b = block.text_rgb
    return f"color:rgb({int(r * 255)},{int(g * 255)},{int(b * 255)});"


def css_run_style_parts(
    block: LayoutIrBlock,
    page: LayoutIrPage,
    measured_scales: dict[int, float] | None = None,
) -> tuple[float, int, str, str, float, float, float]:
    size = run_font_size_pt(block)
    wt = run_font_weight_css(block)
    italic = "font-style:italic;" if is_italic_fontname(block.font_family) else ""
    sx = run_scale_x(block, page, measured_scales)
    ax, ay = run_anchor_pt(block, page)
    line_height = "line-height:0;" if _is_rotated_block(block) else "line-height:1;"
    return size, wt, italic + line_height, css_run_transform(block, sx), sx, ax, ay
