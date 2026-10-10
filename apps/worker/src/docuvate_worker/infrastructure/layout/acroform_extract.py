# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Extract AcroForm field widgets (text + checkbox) into layout IR."""

from __future__ import annotations

import io

from docuvate_worker.domain.layout_ir import LayoutIrWidget, LayoutIrWidgetKind, TextAlign


def _pdf_rect_to_norm(
    rect: list[float], page_width: float, page_height: float
) -> tuple[float, float, float, float]:
    x0, y0, x1, y1 = (float(rect[0]), float(rect[1]), float(rect[2]), float(rect[3]))
    left = x0 / page_width
    top = (page_height - y1) / page_height
    width = max(0.0, (x1 - x0) / page_width)
    height = max(0.0, (y1 - y0) / page_height)
    return left, top, width, height


def _field_value(raw: object) -> str:
    if raw is None:
        return ""
    text = str(raw)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return text.strip()


def _is_checked(raw: object) -> bool:
    if raw is None:
        return False
    name = str(raw)
    return name not in ("/Off", "Off", "")


def _resolve_object(raw: object) -> object:
    if raw is None:
        return None
    if hasattr(raw, "get_object"):
        return raw.get_object()
    return raw


def _text_align_from_field(field_obj, annot) -> TextAlign:
    for source in (annot, field_obj):
        q = source.get("/Q") if hasattr(source, "get") else None
        if q is None:
            continue
        try:
            code = int(q)
        except (TypeError, ValueError):
            continue
        if code == 1:
            return TextAlign.CENTER
        if code == 2:  # noqa: PLR2004
            return TextAlign.RIGHT
        if code == 0:
            return TextAlign.LEFT
    return TextAlign.LEFT


def _font_size_from_da(raw: object) -> float | None:
    if raw is None:
        return None
    parts = str(raw).replace("/", " ").split()
    for idx, token in enumerate(parts):
        if token == "Tf" and idx > 0:
            try:
                return float(parts[idx - 1])
            except ValueError:
                return None
    return None


def _checkbox_check_mark(annot, *, checked: bool) -> str | None:
    if not checked:
        return None
    mk = _resolve_object(annot.get("/MK"))
    if isinstance(mk, dict):
        ca = mk.get("/CA")
        if ca is not None:
            mark = str(ca)
            if mark:
                return mark[0]
    appearance = annot.get("/AS")
    if appearance is not None and _is_checked(appearance):
        name = str(appearance).strip("/")
        if name and name.lower() not in ("off", "no"):
            if "cross" in name.lower() or "x" in name.lower():
                return "8"
            if "check" in name.lower():
                return "4"
    return "8"


def extract_acroform_widgets(content: bytes) -> list[LayoutIrWidget]:
    from pypdf import PdfReader  # noqa: PLC0415

    widgets: list[LayoutIrWidget] = []
    reader = PdfReader(io.BytesIO(content))
    fields = reader.get_fields() or {}

    for page_num, page in enumerate(reader.pages, start=1):
        mediabox = page.mediabox
        page_width = float(mediabox.width)
        page_height = float(mediabox.height)
        if page_width <= 0 or page_height <= 0:
            continue

        annots = page.get("/Annots") or []
        for annot_ref in annots:
            annot = annot_ref.get_object()
            if annot.get("/Subtype") != "/Widget":
                continue
            rect = annot.get("/Rect")
            if not rect or len(rect) < 4:  # noqa: PLR2004
                continue
            nx, ny, nw, nh = _pdf_rect_to_norm(list(rect), page_width, page_height)

            field_type = annot.get("/FT")
            parent = annot.get("/Parent")
            field_obj = parent.get_object() if parent is not None else annot

            field_name = field_obj.get("/T")
            if isinstance(field_name, bytes):
                field_name = field_name.decode("utf-8", errors="replace")
            field_name_str = str(field_name) if field_name else None

            value_raw = field_obj.get("/V")
            if value_raw is None:
                value_raw = annot.get("/V")
            appearance = annot.get("/AS")
            align = _text_align_from_field(field_obj, annot)

            if field_type == "/Btn" or field_obj.get("/FT") == "/Btn":
                checked = _is_checked(value_raw) or _is_checked(appearance)
                widgets.append(
                    LayoutIrWidget(
                        kind=LayoutIrWidgetKind.CHECKBOX,
                        page=page_num,
                        x=nx,
                        y=ny,
                        width=nw,
                        height=nh,
                        checked=checked,
                        field_name=field_name_str,
                        check_mark=_checkbox_check_mark(annot, checked=checked),
                    )
                )
                continue

            value = _field_value(value_raw)
            if not value and field_name_str and field_name_str in fields:
                value = _field_value(fields[field_name_str].get("/V"))

            if not value:
                continue

            line_count = max(1, value.count("\n") + 1)
            box_height_pt = nh * page_height
            da_size = _font_size_from_da(field_obj.get("/DA") or annot.get("/DA"))
            if da_size is not None and da_size > 0:
                font_size_pt = min(11.0, da_size)
            else:
                font_size_pt = min(
                    11.0,
                    max(8.0, box_height_pt / (line_count * 1.35)),
                )

            widgets.append(
                LayoutIrWidget(
                    kind=LayoutIrWidgetKind.TEXT,
                    page=page_num,
                    x=nx,
                    y=ny,
                    width=nw,
                    height=nh,
                    value=value,
                    field_name=field_name_str,
                    font_size_pt=font_size_pt,
                    align=align,
                )
            )

    deduped: list[LayoutIrWidget] = []
    seen: set[tuple[int, str, int, int, int, int]] = set()
    for widget in widgets:
        key = (
            widget.page,
            widget.field_name or "",
            round(widget.x * 10_000),
            round(widget.y * 10_000),
            round(widget.width * 10_000),
            round(widget.height * 10_000),
        )
        if key in seen:
            continue
        seen.add(key)
        deduped.append(widget)
    return deduped
