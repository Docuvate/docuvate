# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Extract vector primitives (lines, rects, curves) from pdfplumber pages."""

from __future__ import annotations

from docuvate_worker.domain.layout_ir import LayoutIrVector, LayoutIrVectorKind


def _norm(
    x0: float, top: float, x1: float, bottom: float, pw: float, ph: float
) -> tuple[float, float, float, float]:
    return (
        x0 / pw,
        top / ph,
        max(0.0, (x1 - x0) / pw),
        max(0.0, (bottom - top) / ph),
    )


def _parse_color(raw: object) -> tuple[float, float, float] | None:
    if isinstance(raw, (list, tuple)) and len(raw) >= 3:  # noqa: PLR2004
        return float(raw[0]), float(raw[1]), float(raw[2])
    if isinstance(raw, (int, float)):
        g = float(raw)
        return g, g, g
    return None


def _linewidth_pt(raw: object) -> float:
    if raw is None:
        return 0.35
    try:
        value = float(raw)
    except (TypeError, ValueError):
        return 0.35
    if value <= 0:
        return 0.35
    return value


def _rect_key(
    x0: float, top: float, x1: float, bottom: float, stroke_w: float, filled: bool
) -> tuple[float, float, float, float, float, bool]:
    return (
        round(x0, 1),
        round(top, 1),
        round(x1, 1),
        round(bottom, 1),
        round(stroke_w, 2),
        filled,
    )


def _dedupe_vectors(vectors: list[LayoutIrVector]) -> list[LayoutIrVector]:
    seen: set[tuple] = set()
    out: list[LayoutIrVector] = []
    for vector in vectors:
        key = (
            vector.kind.value,
            round(vector.x, 4),
            round(vector.y, 4),
            round(vector.width, 4),
            round(vector.height, 4),
            round(vector.stroke_width_pt, 2),
            vector.filled,
        )
        if key in seen:
            continue
        seen.add(key)
        out.append(vector)
    return out


def extract_vectors(page, page_width: float, page_height: float) -> list[LayoutIrVector]:
    if page_width <= 0 or page_height <= 0:
        return []
    page_area = page_width * page_height
    out: list[LayoutIrVector] = []
    seen_rects: set[tuple[float, float, float, float, float, bool]] = set()

    for rect in page.rects or []:
        x0 = float(rect["x0"])
        x1 = float(rect["x1"])
        top = float(rect["top"])
        bottom = float(rect["bottom"])
        w = x1 - x0
        h = bottom - top
        if w < 0.25 and h < 0.25:  # noqa: PLR2004
            continue
        nx, ny, nw, nh = _norm(x0, top, x1, bottom, page_width, page_height)
        fill_rgb = _parse_color(rect.get("non_stroking_color"))
        stroke_rgb = _parse_color(rect.get("stroking_color"))
        filled = False
        fill_gray: float | None = None
        if fill_rgb is not None:
            r, g, b = fill_rgb
            avg = (r + g + b) / 3.0
            if r >= 0.97 and g >= 0.97 and b >= 0.97:  # noqa: PLR2004
                filled = False
            elif avg >= 0.75:  # noqa: PLR2004
                filled = True
                fill_gray = avg
            elif avg <= 0.15 and w * h > page_area * 0.2:  # noqa: PLR2004
                continue
        stroke_w = _linewidth_pt(rect.get("linewidth"))
        rect_key = _rect_key(x0, top, x1, bottom, stroke_w, filled)
        if rect_key in seen_rects:
            continue
        seen_rects.add(rect_key)
        if w * h > page_area * 0.45 and (stroke_w < 1.0 or filled):
            continue
        out.append(
            LayoutIrVector(
                kind=LayoutIrVectorKind.RECT,
                x=nx,
                y=ny,
                width=nw,
                height=nh,
                stroke_width_pt=stroke_w,
                filled=filled,
                fill_gray=fill_gray,
                fill_rgb=fill_rgb if filled else None,
                stroke_rgb=stroke_rgb,
            )
        )

    for line in page.lines or []:
        x0 = float(line["x0"])
        x1 = float(line["x1"])
        top = float(line["top"])
        bottom = float(line["bottom"])
        nx, ny, nw, nh = _norm(
            min(x0, x1),
            min(top, bottom),
            max(x0, x1),
            max(top, bottom),
            page_width,
            page_height,
        )
        if nw < 0.0005 and nh < 0.0005:  # noqa: PLR2004
            continue
        stroke_rgb = _parse_color(line.get("stroking_color"))
        out.append(
            LayoutIrVector(
                kind=LayoutIrVectorKind.LINE,
                x=nx,
                y=ny,
                width=max(nw, 0.0005),
                height=max(nh, 0.0005),
                stroke_width_pt=_linewidth_pt(line.get("linewidth")),
                stroke_rgb=stroke_rgb,
            )
        )

    for edge in page.edges or []:
        x0 = float(edge["x0"])
        x1 = float(edge["x1"])
        top = float(edge["top"])
        bottom = float(edge["bottom"])
        orient = str(edge.get("orientation") or "")
        stroke_rgb = _parse_color(edge.get("stroking_color"))
        stroke_w = _linewidth_pt(edge.get("linewidth"))
        if orient == "h" and abs(bottom - top) < 1.0:
            nx, ny, nw, nh = _norm(
                min(x0, x1),
                top,
                max(x0, x1),
                top + max(abs(bottom - top), 0.01),
                page_width,
                page_height,
            )
            out.append(
                LayoutIrVector(
                    kind=LayoutIrVectorKind.LINE,
                    x=nx,
                    y=ny,
                    width=max(nw, 0.0005),
                    height=max(nh, 0.0005),
                    stroke_width_pt=stroke_w,
                    stroke_rgb=stroke_rgb,
                )
            )
        elif orient == "v" and abs(x1 - x0) < 1.0:
            nx, ny, nw, nh = _norm(
                x0,
                min(top, bottom),
                x0 + max(abs(x1 - x0), 0.01),
                max(top, bottom),
                page_width,
                page_height,
            )
            out.append(
                LayoutIrVector(
                    kind=LayoutIrVectorKind.LINE,
                    x=nx,
                    y=ny,
                    width=max(nw, 0.0005),
                    height=max(nh, 0.0005),
                    stroke_width_pt=stroke_w,
                    stroke_rgb=stroke_rgb,
                )
            )

    for curve in page.curves or []:
        pts = curve.get("pts") or []
        if len(pts) < 2:  # noqa: PLR2004
            continue
        parts: list[str] = []
        x0, y0 = float(pts[0][0]), float(pts[0][1])
        parts.append(f"M {x0:.3f} {y0:.3f}")
        for px, py in pts[1:]:
            parts.append(f"L {float(px):.3f} {float(py):.3f}")
        xs = [float(p[0]) for p in pts]
        ys = [float(p[1]) for p in pts]
        nx, ny, nw, nh = _norm(min(xs), min(ys), max(xs), max(ys), page_width, page_height)
        stroke_rgb = _parse_color(curve.get("stroking_color"))
        out.append(
            LayoutIrVector(
                kind=LayoutIrVectorKind.PATH,
                x=nx,
                y=ny,
                width=nw,
                height=nh,
                stroke_width_pt=_linewidth_pt(curve.get("linewidth")),
                stroke_rgb=stroke_rgb,
                path_d=" ".join(parts),
            )
        )
    return _dedupe_vectors(_drop_nested_stroke_rects(out, page_width, page_height))


def _drop_nested_stroke_rects(
    vectors: list[LayoutIrVector], page_width: float, page_height: float
) -> list[LayoutIrVector]:
    """Drop full-page borders and outer duplicates that stack strokes in the raster."""
    page_area = page_width * page_height
    rects = [v for v in vectors if v.kind == LayoutIrVectorKind.RECT and not v.filled]
    if not rects:
        return vectors
    drop: set[int] = set()
    for idx, outer in enumerate(rects):
        ow = outer.width * page_width
        oh = outer.height * page_height
        if ow * oh < page_area * 0.35:
            continue
        for jdx, inner in enumerate(rects):
            if idx == jdx:
                continue
            ix, iy = inner.x * page_width, inner.y * page_height
            ox, oy = outer.x * page_width, outer.y * page_height
            if (
                ix >= ox - 1.5
                and iy >= oy - 1.5
                and ix + inner.width * page_width <= ox + ow + 1.5
                and iy + inner.height * page_height <= oy + oh + 1.5
            ):
                drop.add(id(outer))
    filtered: list[LayoutIrVector] = []
    for vector in vectors:
        if vector.kind == LayoutIrVectorKind.RECT and not vector.filled and id(vector) in drop:
            continue
        if (
            vector.kind == LayoutIrVectorKind.RECT
            and not vector.filled
            and vector.width * page_width * vector.height * page_height > page_area * 0.82
        ):
            continue
        filtered.append(vector)
    return filtered
