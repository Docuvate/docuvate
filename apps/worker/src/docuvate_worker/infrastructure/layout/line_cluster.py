# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Cluster word-level layout blocks into line runs for render targets."""

from __future__ import annotations

from docuvate_worker.domain.layout_ir import LayoutIrBlock, LayoutIrLine, TextAlign

_LINE_Y_TOLERANCE = 0.006
# Split same-baseline runs when columns leave a wide horizontal gap (pt, min ~1 inch).
_MIN_H_GAP_PT = 28.0
_SIZE_SPLIT_PT = 0.75


def _style_break(a: LayoutIrBlock, b: LayoutIrBlock) -> bool:
    if a.weight != b.weight:
        return True
    sa = a.font_size_pt
    sb = b.font_size_pt
    if sa is None or sb is None:
        return False
    return abs(sa - sb) > _SIZE_SPLIT_PT


def _split_row_segments(
    row: list[LayoutIrBlock], page_width_pt: float
) -> list[list[LayoutIrBlock]]:
    if not row:
        return []
    row = sorted(row, key=lambda b: b.x)
    gap_norm = _MIN_H_GAP_PT / max(page_width_pt, 1.0)
    segments: list[list[LayoutIrBlock]] = [[row[0]]]
    for block in row[1:]:
        prev = segments[-1][-1]
        prev_end = prev.x + prev.width
        if block.x - prev_end > gap_norm or _style_break(prev, block):
            segments.append([block])
        else:
            segments[-1].append(block)
    return segments


def cluster_blocks_into_lines(
    blocks: list[LayoutIrBlock], *, page_width_pt: float = 595.28
) -> list[LayoutIrLine]:
    if not blocks:
        return []

    sorted_blocks = sorted(blocks, key=lambda b: (b.y, b.x))
    y_rows: list[list[LayoutIrBlock]] = []
    for block in sorted_blocks:
        if not block.text.strip():
            continue
        if not y_rows:
            y_rows.append([block])
            continue
        ref = y_rows[-1][0]
        if abs(ref.y - block.y) <= _LINE_Y_TOLERANCE:
            y_rows[-1].append(block)
        else:
            y_rows.append([block])

    groups: list[list[LayoutIrBlock]] = []
    for row in y_rows:
        groups.extend(_split_row_segments(row, page_width_pt))

    lines: list[LayoutIrLine] = []
    for group in groups:
        group.sort(key=lambda b: b.x)
        text = " ".join(b.text.strip() for b in group).strip()
        if not text:
            continue
        x0 = min(b.x for b in group)
        y0 = min(b.y for b in group)
        x1 = max(b.x + b.width for b in group)
        y1 = max(b.y + b.height for b in group)
        sizes = [b.font_size_pt for b in group if b.font_size_pt is not None]
        size_pt = sizes[0] if sizes else None
        weight = group[0].weight
        font_family = group[0].font_family
        anchor = next((b.block_index for b in group if b.block_index is not None), None)
        lines.append(
            LayoutIrLine(
                page=group[0].page,
                x=x0,
                y=y0,
                width=max(0.0, x1 - x0),
                height=max(0.0, y1 - y0),
                text=text,
                font_family=font_family,
                font_size_pt=size_pt,
                weight=weight,
                align=TextAlign.LEFT,
                block_index=anchor,
            )
        )
    return lines
