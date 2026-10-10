# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Render LayoutIrDocument to Typst source (absolute pt placement, line runs)."""

from __future__ import annotations

import unicodedata

from docuvate_worker.domain.layout_ir import (
    FontWeight,
    LayoutIrBlock,
    LayoutIrDocument,
    LayoutIrPage,
    LayoutIrVector,
    LayoutIrVectorKind,
    LayoutIrWidget,
    LayoutIrWidgetKind,
)
from docuvate_worker.infrastructure.layout.font_map import is_italic_fontname, typst_font_and_scale
from docuvate_worker.infrastructure.layout.render_run import (
    run_anchor_pt,
    run_font_size_pt,
    run_scale_x,
)
from docuvate_worker.infrastructure.layout.widget_placement import (
    typst_align_in_box,
    widget_text_origin_pt,
)


def _escape_typst(text: str) -> str:
    escaped = (
        text.replace("\\", "\\\\")
        .replace("#", "\\#")
        .replace("$", "\\$")
        .replace("@", "\\@")
        .replace("<", "\\<")
        .replace(">", "\\>")
        .replace("/", "\\/")
        .replace("*", "\\*")
        .replace("_", "\\_")
        .replace("[", "\\[")
        .replace("]", "\\]")
        .replace("{", "\\{")
        .replace("}", "\\}")
        .replace('"', '\\"')
        .replace("`", "\\`")
        .replace("~", "\\~")
        .replace("-", "\\-")
    )
    if escaped.startswith("="):
        return "\\=" + escaped[1:]
    return escaped


def _typst_raw_literal(text: str) -> str:
    normalized = unicodedata.normalize("NFKC", text)
    escaped = normalized.replace("\\", "\\\\").replace('"', '\\"')
    return f'#raw("{escaped}") '


def _typst_text_body(text: str) -> str:
    """Typst text content (literal via #raw so +, parens, and math letters do not open math mode)."""
    return _typst_raw_literal(text)


def _x_pt(norm: float, page_width_pt: float) -> float:
    return norm * page_width_pt


def _y_pt(norm: float, page_height_pt: float) -> float:
    return norm * page_height_pt


def _vector_typst(vector: LayoutIrVector, page: LayoutIrPage) -> str:
    x = _x_pt(vector.x, page.width_pt)
    y = _y_pt(vector.y, page.height_pt)
    w = max(_x_pt(vector.width, page.width_pt), 0.5)
    h = max(_y_pt(vector.height, page.height_pt), 0.5)
    stroke = vector.stroke_width_pt
    if vector.kind == LayoutIrVectorKind.LINE and h > w:
        return (
            f"#place(top + left, dx: {x:.2f}pt, dy: {y:.2f}pt)["
            f"#line(length: {h:.2f}pt, angle: 90deg, stroke: {stroke}pt + black)]"
        )
    if vector.kind == LayoutIrVectorKind.LINE:
        return (
            f"#place(top + left, dx: {x:.2f}pt, dy: {y:.2f}pt)["
            f"#line(length: {w:.2f}pt, stroke: {stroke}pt + black)]"
        )
    fill = "white"
    if vector.filled:
        if vector.fill_rgb is not None:
            r, g, b = vector.fill_rgb
            fill = (
                f"rgb({int(r * 255)}, {int(g * 255)}, {int(b * 255)})"
            )
        elif vector.fill_gray is not None:
            gray = int(max(0.0, min(1.0, vector.fill_gray)) * 255)
            fill = f"rgb({gray}, {gray}, {gray})"
    if not vector.filled:
        stroke_part = f", stroke: {stroke}pt + black"
    else:
        stroke_part = f", stroke: {stroke}pt + rgb(180,180,180)"
    return (
        f"#place(top + left, dx: {x:.2f}pt, dy: {y:.2f}pt)["
        f"#box(width: {w:.2f}pt, height: {h:.2f}pt, fill: {fill}{stroke_part})[]]"
    )


def _typst_style(fontname: str | None) -> str:
    return ", style: \"italic\"" if is_italic_fontname(fontname) else ""


def _run_typst(block: LayoutIrBlock, page: LayoutIrPage, _doc: LayoutIrDocument) -> str:
    x, y = run_anchor_pt(block, page, baseline_origin=True)
    size = run_font_size_pt(block)
    weight = "bold" if block.weight == FontWeight.BOLD else "regular"
    text = _typst_text_body(block.text)
    font, _scale = typst_font_and_scale(block.font_family)
    style = _typst_style(block.font_family)
    sx = run_scale_x(block, page)
    inner = (
        f"#text(size: {size}pt, weight: \"{weight}\", font: \"{font}\", "
        f"hyphenate: false{style})[{text}]"
    )
    if abs(sx - 1.0) > 0.015:
        inner = f"#scale(x: {sx * 100:.2f}%, origin: left)[{inner}]"
    if block.rotation_deg is not None:
        inner = f"#rotate({block.rotation_deg:.2f}deg, origin: left + top)[{inner}]"
    return f"#place(top + left, dx: {x:.2f}pt, dy: {y:.2f}pt)[{inner}]"


def _checkbox_mark_typst(widget: LayoutIrWidget, h: float) -> str:
    if not widget.checked:
        return ""
    mark = _escape_typst(widget.check_mark or "8")
    fs = min(max(h * 0.85, 6.0), 12.0)
    return (
        f"#align(center + horizon)[#text(size: {fs:.1f}pt, font: \"Zapf Dingbats\")[{mark}]]"
    )


def _widget_typst(widget: LayoutIrWidget, page: LayoutIrPage, _doc: LayoutIrDocument) -> str:
    x = _x_pt(widget.x, page.width_pt)
    y = _y_pt(widget.y, page.height_pt)
    w = max(_x_pt(widget.width, page.width_pt), 4.0)
    h = max(_y_pt(widget.height, page.height_pt), 4.0)
    if widget.kind == LayoutIrWidgetKind.CHECKBOX:
        mark = _checkbox_mark_typst(widget, h)
        return (
            f"#place(top + left, dx: {x:.2f}pt, dy: {y:.2f}pt)["
            f"#box(width: {w:.2f}pt, height: {h:.2f}pt, stroke: 0.5pt + black, fill: white)[{mark}]"
            f"]"
        )

    font, scale = typst_font_and_scale(widget.font_family)
    size = min(11.0, (widget.font_size_pt or 10.0)) * scale
    lines = [ln for ln in widget.value.replace("\r", "").split("\n") if ln.strip()]
    if not lines:
        return ""
    align = typst_align_in_box(widget)
    parts: list[str] = []
    for idx, line in enumerate(lines):
        wx, y_adj, inner_w = widget_text_origin_pt(
            widget,
            page_width_pt=page.width_pt,
            page_height_pt=page.height_pt,
            font_size_pt=size,
            line_index=idx,
            line_count=len(lines),
        )
        body = _typst_text_body(line.strip())
        rot = ""
        if widget.rotation_deg:
            rot = f"#rotate({widget.rotation_deg}deg, origin: left + top)["
            end = "]"
        else:
            end = ""
        parts.append(
            f"#place(top + left, dx: {wx:.2f}pt, dy: {y_adj:.2f}pt)["
            f"#box(width: {inner_w:.2f}pt, inset: 0pt)[#align({align})[{rot}"
            f"#text(size: {size}pt, font: \"{font}\", hyphenate: false)[{body}]{end}]]"
            f"]"
        )
    return "\n".join(parts)


def _page_canvas(page: LayoutIrPage, doc: LayoutIrDocument) -> str:
    chunks: list[str] = []
    for vector in page.vectors:
        chunks.append(_vector_typst(vector, page))
    for block in page.blocks:
        chunks.append(_run_typst(block, page, doc))
    for widget in page.widgets:
        part = _widget_typst(widget, page, doc)
        if part:
            chunks.append(part)
    return "\n".join(chunks)


def layout_ir_to_typst_exakt(doc: LayoutIrDocument) -> str:
    parts: list[str] = [
        "// Generated by docuvate-worker layout IR to Typst",
        "#set page(margin: 0pt)",
        '#set text(size: 11pt, hyphenate: false, top-edge: "baseline")',
    ]
    for page in sorted(doc.pages, key=lambda p: p.page):
        if len(doc.pages) > 1:
            parts.append(f"// --- page {page.page} ---")
        parts.append("#page(")
        parts.append(f"  width: {page.width_pt}pt,")
        parts.append(f"  height: {page.height_pt}pt,")
        parts.append("  margin: 0pt,")
        parts.append(")[")
        parts.append(_page_canvas(page, doc))
        parts.append("]")
    return "\n".join(parts)


def layout_ir_to_typst(doc: LayoutIrDocument) -> str:
    """Pixel-faithful Typst export (exakt)."""
    return layout_ir_to_typst_exakt(doc)
