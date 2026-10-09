# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Drop duplicate AcroForm appearance text vs widgets/blocks."""

from __future__ import annotations

from docuvate_worker.domain.layout_ir import (
    LayoutIrBlock,
    LayoutIrWidget,
    LayoutIrWidgetKind,
)


def _center_norm(block: LayoutIrBlock) -> tuple[float, float]:
    return block.x + block.width / 2, block.y + block.height / 2


def _inside_norm(px: float, py: float, x: float, y: float, w: float, h: float) -> bool:
    return x <= px <= x + w and y <= py <= y + h


def filter_duplicate_acroform_blocks(
    blocks: list[LayoutIrBlock],
    widgets: list[LayoutIrWidget],
) -> list[LayoutIrBlock]:
    text_widgets = [w for w in widgets if w.kind == LayoutIrWidgetKind.TEXT and w.value.strip()]
    if not text_widgets:
        return blocks
    kept: list[LayoutIrBlock] = []
    for block in blocks:
        cx, cy = _center_norm(block)
        drop = False
        for widget in text_widgets:
            if _inside_norm(cx, cy, widget.x, widget.y, widget.width, widget.height):
                drop = True
                break
        if not drop:
            kept.append(block)
    return kept


def filter_redundant_text_widgets(
    blocks: list[LayoutIrBlock],
    widgets: list[LayoutIrWidget],
) -> list[LayoutIrWidget]:
    kept: list[LayoutIrWidget] = []
    for widget in widgets:
        if widget.kind != LayoutIrWidgetKind.TEXT:
            kept.append(widget)
            continue
        value = widget.value.strip()
        if not value:
            continue
        covered = False
        for block in blocks:
            if block.rotation_deg is not None:
                continue
            cx, cy = _center_norm(block)
            if not _inside_norm(cx, cy, widget.x, widget.y, widget.width, widget.height):
                continue
            if block.text.strip() and block.text.strip() in value.replace("\n", " "):
                covered = True
                break
        if not covered:
            kept.append(widget)
    return kept
