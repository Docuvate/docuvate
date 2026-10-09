"""Render LayoutIrDocument to absolute-position HTML (pdf2htmlEX-style fidelity)."""

from __future__ import annotations

from html import escape

from docuvate_worker.domain.layout_ir import (
    LayoutIrDocument,
    LayoutIrPage,
    LayoutIrVectorKind,
    LayoutIrWidget,
    LayoutIrWidgetKind,
)
from docuvate_worker.infrastructure.layout.font_map import css_font_family
from docuvate_worker.infrastructure.layout.layout_html_styles import LAYOUT_HTML_HEAD
from docuvate_worker.infrastructure.layout.render_run import css_run_color, css_run_style_parts
from docuvate_worker.infrastructure.layout.stroke_render import stroke_width_pt_for_render
from docuvate_worker.infrastructure.layout.widget_placement import (
    css_text_align,
    widget_text_origin_pt,
)


def _rgb_css(rgb: tuple[float, float, float] | None, *, default: str = "#000") -> str:
    if rgb is None:
        return default
    r, g, b = rgb
    return f"rgb({int(r * 255)},{int(g * 255)},{int(b * 255)})"


def _style_attr(*parts: str) -> str:
    return f' style="{escape("".join(parts), quote=True)}"'


def _vectors_svg(page: LayoutIrPage) -> str:
    pw, ph = page.width_pt, page.height_pt
    parts: list[str] = [
        f'<svg class="vectors" xmlns="http://www.w3.org/2000/svg" '
        f'width="{pw}pt" height="{ph}pt" viewBox="0 0 {pw} {ph}" '
        f'style="position:absolute;left:0;top:0;pointer-events:none;">'
    ]
    for vector in page.vectors:
        stroke = _rgb_css(vector.stroke_rgb)
        sw = stroke_width_pt_for_render(vector.stroke_width_pt)
        if vector.kind == LayoutIrVectorKind.PATH and vector.path_d:
            parts.append(
                f'<path d="{escape(vector.path_d)}" fill="none" stroke="{stroke}" '
                f'stroke-width="{sw}"/>'
            )
            continue
        x = vector.x * pw
        y = vector.y * ph
        w = max(vector.width * pw, 0.5)
        h = max(vector.height * ph, 0.5)
        if vector.kind == LayoutIrVectorKind.LINE:
            if h > w:
                parts.append(
                    f'<line x1="{x:.3f}" y1="{y:.3f}" x2="{x:.3f}" y2="{y + h:.3f}" '
                    f'stroke="{stroke}" stroke-width="{sw}"/>'
                )
            else:
                parts.append(
                    f'<line x1="{x:.3f}" y1="{y:.3f}" x2="{x + w:.3f}" y2="{y:.3f}" '
                    f'stroke="{stroke}" stroke-width="{sw}"/>'
                )
            continue
        fill = "none"
        if vector.filled and vector.fill_rgb is not None:
            fill = _rgb_css(vector.fill_rgb)
        elif vector.filled and vector.fill_gray is not None:
            g = int(vector.fill_gray * 255)
            fill = f"rgb({g},{g},{g})"
        parts.append(
            f'<rect x="{x:.3f}" y="{y:.3f}" width="{w:.3f}" height="{h:.3f}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
        )
    parts.append("</svg>")
    return "\n".join(parts)


def _run_html(
    block,
    page: LayoutIrPage,
    _doc: LayoutIrDocument,
) -> str:
    fs, wt, italic, transform, _sx, ax, ay = css_run_style_parts(block, page, None)
    ff = css_font_family(block.font_family)
    color = css_run_color(block)
    idx_attr = (
        f' data-block-index="{int(block.block_index)}"' if block.block_index is not None else ""
    )
    style = (
        f"position:absolute;left:{ax}pt;top:{ay}pt;"
        f"white-space:pre;font-size:{fs}pt;font-weight:{wt};font-family:{ff};"
        f"{italic}{color}{transform}"
    )
    return (
        f"<span class=\"run\"{idx_attr}{_style_attr(style)}>"
        f"{escape(block.text)}</span>"
    )


def _zapf_mark_html(mark: str) -> str:
    return escape(mark)


def _widget_html(widget: LayoutIrWidget, pw: float, ph: float, _doc: LayoutIrDocument) -> str:
    x = widget.x * pw
    y = widget.y * ph
    w = max(widget.width * pw, 4.0)
    h = max(widget.height * ph, 4.0)
    if widget.kind == LayoutIrWidgetKind.CHECKBOX:
        mark = ""
        if widget.checked:
            mark = _zapf_mark_html(widget.check_mark or "8")
        fs = min(max(h * 0.85, 6.0), 12.0)
        box_style = (
            f"position:absolute;left:{x}pt;top:{y}pt;"
            f"width:{w}pt;height:{h}pt;border:0.5pt solid #333;background:#fff;"
            f"display:flex;align-items:center;justify-content:center;font-size:{fs:.1f}pt;"
            f'font-family:"Zapf Dingbats","Segoe UI Symbol",sans-serif;'
        )
        return f'<div class="widget checkbox"{_style_attr(box_style)}>{mark}</div>'
    if not widget.value.strip():
        return ""
    ff = css_font_family(widget.font_family)
    fs = min(11.0, widget.font_size_pt or 10)
    lines = [ln for ln in widget.value.replace("\r", "").split("\n") if ln.strip()]
    align = css_text_align(widget)
    parts: list[str] = []
    for idx, line in enumerate(lines):
        wx, y_line, inner_w = widget_text_origin_pt(
            widget,
            page_width_pt=pw,
            page_height_pt=ph,
            font_size_pt=fs,
            line_index=idx,
            line_count=len(lines),
        )
        line_style = (
            f"position:absolute;left:{wx}pt;top:{y_line}pt;"
            f"width:{inner_w}pt;font-size:{fs}pt;font-family:{ff};line-height:0;display:block;"
            f"text-align:{align};white-space:pre;overflow:hidden;"
        )
        parts.append(
            f'<div class="widget field-line"{_style_attr(line_style)}>'
            f"{escape(line.strip())}</div>"
        )
    return "\n".join(parts)


def _page_html(
    page: LayoutIrPage,
    doc: LayoutIrDocument,
) -> str:
    pw, ph = page.width_pt, page.height_pt
    page_style = (
        f"position:relative;width:{pw}pt;height:{ph}pt;"
        f"margin:0 auto 12pt;background:#fff;font-family:{css_font_family(None)};"
    )
    parts: list[str] = [
        f'<section class="page" data-page="{page.page}"{_style_attr(page_style)}>'
    ]
    parts.append(_vectors_svg(page))
    for block in page.blocks:
        parts.append(_run_html(block, page, doc))
    for widget in page.widgets:
        part = _widget_html(widget, pw, ph, doc)
        if part:
            parts.append(part)
    parts.append("</section>")
    return "\n".join(parts)


def layout_ir_to_html(doc: LayoutIrDocument) -> str:
    body = "\n".join(
        _page_html(p, doc) for p in sorted(doc.pages, key=lambda p: p.page)
    )
    return f"""<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"/>
{LAYOUT_HTML_HEAD}
</head><body><div class="layout-root">{body}</div></body></html>"""
