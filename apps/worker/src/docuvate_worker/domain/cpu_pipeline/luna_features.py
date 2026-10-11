# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""LUNA-style text-mirror normalization and block feature channels (CPU, no GPU)."""

from __future__ import annotations

import math

from docuvate_worker.domain.models import ExtractionBlock


def text_mirror_bounds(blocks: tuple[ExtractionBlock, ...]) -> tuple[float, float, float, float]:
    if not blocks:
        return 0.0, 0.0, 1.0, 1.0
    x0 = min(b.x for b in blocks)
    y0 = min(b.y for b in blocks)
    x1 = max(b.x + b.width for b in blocks)
    y1 = max(b.y + b.height for b in blocks)
    if x1 <= x0:
        x1 = x0 + 1e-6
    if y1 <= y0:
        y1 = y0 + 1e-6
    return x0, y0, x1, y1


def normalize_blocks_to_text_mirror(
    blocks: tuple[ExtractionBlock, ...],
) -> tuple[ExtractionBlock, ...]:
    x0, y0, x1, y1 = text_mirror_bounds(blocks)
    span_x = x1 - x0
    span_y = y1 - y0
    normalized: list[ExtractionBlock] = []
    for block in blocks:
        nx = (block.x - x0) / span_x
        ny = (block.y - y0) / span_y
        nw = block.width / span_x
        nh = block.height / span_y
        normalized.append(
            ExtractionBlock(
                page=block.page,
                x=max(0.0, min(1.0, nx)),
                y=max(0.0, min(1.0, ny)),
                width=max(0.0, min(1.0, nw)),
                height=max(0.0, min(1.0, nh)),
                text=block.text,
                block_index=block.block_index,
            )
        )
    return tuple(normalized)


def block_geometry_channel(block: ExtractionBlock) -> tuple[float, float, float, float]:
    area = block.width * block.height
    aspect = block.width / max(block.height, 1e-6)
    center_x = block.x + block.width / 2.0
    center_y = block.y + block.height / 2.0
    return center_x, center_y, area, math.log1p(aspect)


def neighbor_channel(
    blocks: tuple[ExtractionBlock, ...],
    index: int,
    *,
    radius: float = 0.08,
) -> tuple[float, float, float]:
    if not blocks:
        return 0.0, 0.0, 0.0
    self = blocks[index]
    cx = self.x + self.width / 2.0
    cy = self.y + self.height / 2.0
    left = 0
    right = 0
    above = 0
    for j, other in enumerate(blocks):
        if j == index:
            continue
        ox = other.x + other.width / 2.0
        oy = other.y + other.height / 2.0
        if math.hypot(ox - cx, oy - cy) > radius:
            continue
        if ox < cx - 1e-4:
            left += 1
        elif ox > cx + 1e-4:
            right += 1
        if oy < cy - 1e-4:
            above += 1
    return float(left), float(right), float(above)
