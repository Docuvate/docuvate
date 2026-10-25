# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Normalized [0, 1] page coordinates for extraction blocks."""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass
from typing import Final

from docuvate_worker.domain.models import ExtractionBlock

logger = logging.getLogger(__name__)

UNIT_INTERVAL_EPSILON: Final = 1e-6


@dataclass(frozen=True)
class PageDimensions:
    width: float
    height: float

    def valid(self) -> bool:
        return (
            math.isfinite(self.width)
            and math.isfinite(self.height)
            and self.width > 0.0
            and self.height > 0.0
        )


def clamp_to_unit_interval(value: float) -> float:
    if not math.isfinite(value):
        return math.nan
    if value < 0.0:
        return 0.0
    if value <= 1.0:
        return value
    if value <= 1.0 + UNIT_INTERVAL_EPSILON:
        return 1.0
    return math.nan


def _coord_clearly_not_normalized(value: float) -> bool:
    return math.isfinite(value) and value > 1.0 + UNIT_INTERVAL_EPSILON


def _looks_like_unnormalized_page_coords(block: ExtractionBlock) -> bool:
    for value in (block.x, block.y, block.width, block.height):
        if _coord_clearly_not_normalized(value):
            return True
    return False


def normalized_box_from_absolute(
    x0: float,
    y0: float,
    x1: float,
    y1: float,
    page: PageDimensions,
) -> tuple[float, float, float, float] | None:
    if not page.valid():
        return None
    left = min(x0, x1)
    right = max(x0, x1)
    top = min(y0, y1)
    bottom = max(y0, y1)
    x = clamp_to_unit_interval(left / page.width)
    y = clamp_to_unit_interval(top / page.height)
    width = clamp_to_unit_interval((right - left) / page.width)
    height = clamp_to_unit_interval((bottom - top) / page.height)
    if not all(math.isfinite(v) for v in (x, y, width, height)):
        return None
    if width <= 0.0 or height <= 0.0:
        return None
    if x + width > 1.0:
        width = clamp_to_unit_interval(1.0 - x)
    if y + height > 1.0:
        height = clamp_to_unit_interval(1.0 - y)
    if width <= 0.0 or height <= 0.0:
        return None
    return x, y, width, height


def extraction_block_from_absolute(
    *,
    page: int,
    x0: float,
    y0: float,
    x1: float,
    y1: float,
    page_size: PageDimensions,
    text: str,
    block_index: int | None = None,
) -> ExtractionBlock | None:
    box = normalized_box_from_absolute(x0, y0, x1, y1, page_size)
    if box is None:
        return None
    body = text.strip()
    if not body:
        return None
    x, y, width, height = box
    return ExtractionBlock(
        page=page,
        x=x,
        y=y,
        width=width,
        height=height,
        text=body,
        block_index=block_index,
    )


def extraction_block_from_normalized(
    *,
    page: int,
    x: float,
    y: float,
    width: float,
    height: float,
    text: str,
    block_index: int | None = None,
) -> ExtractionBlock | None:
    body = text.strip()
    if not body:
        return None
    nx = clamp_to_unit_interval(x)
    ny = clamp_to_unit_interval(y)
    nw = clamp_to_unit_interval(width)
    nh = clamp_to_unit_interval(height)
    if not all(math.isfinite(v) for v in (nx, ny, nw, nh)):
        return None
    if nw <= 0.0 or nh <= 0.0:
        return None
    return ExtractionBlock(
        page=page,
        x=nx,
        y=ny,
        width=nw,
        height=nh,
        text=body,
        block_index=block_index,
    )


def sanitize_extraction_blocks(
    blocks: list[ExtractionBlock] | None,
    *,
    context: str,
) -> list[ExtractionBlock] | None:
    if not blocks:
        return blocks
    kept: list[ExtractionBlock] = []
    for index, block in enumerate(blocks):
        if _looks_like_unnormalized_page_coords(block):
            logger.warning(
                "dropping_extraction_block_unnormalized context=%s index=%s page=%s "
                "x=%.4f y=%.4f width=%.4f height=%.4f",
                context,
                index,
                block.page,
                block.x,
                block.y,
                block.width,
                block.height,
            )
            continue
        coerced = extraction_block_from_normalized(
            page=block.page,
            x=block.x,
            y=block.y,
            width=block.width,
            height=block.height,
            text=block.text,
            block_index=block.block_index,
        )
        if coerced is None:
            logger.warning(
                "dropping_extraction_block_invalid context=%s index=%s page=%s",
                context,
                index,
                block.page,
            )
            continue
        kept.append(coerced)
    return kept or None
