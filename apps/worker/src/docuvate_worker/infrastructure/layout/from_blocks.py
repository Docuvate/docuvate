# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Build layout IR from extraction blocks when geometry-only engines ran (OCR)."""

from __future__ import annotations

import logging
from statistics import median

from docuvate_worker.domain.layout_ir import (
    LAYOUT_IR_VERSION,
    FontWeight,
    LayoutIrBlock,
    LayoutIrDocument,
    LayoutIrPage,
    TextAlign,
)
from docuvate_worker.domain.models import ExtractionBlock
from docuvate_worker.infrastructure.layout.layout_ir_limits import (
    MAX_LAYOUT_BLOCKS,
    MAX_LAYOUT_ELEMENTS,
    MAX_LAYOUT_PAGES,
)

_logger = logging.getLogger(__name__)

_DEFAULT_WIDTH_PT = 612.0
_DEFAULT_HEIGHT_PT = 792.0


def _line_center_y(block: ExtractionBlock) -> float:
    return block.y + block.height / 2.0


def _text_with_inter_word_spaces(line: list[ExtractionBlock]) -> list[tuple[ExtractionBlock, str]]:
    if not line:
        return []
    out: list[tuple[ExtractionBlock, str]] = []
    prev: ExtractionBlock | None = None
    for block in line:
        token = block.text.strip()
        if not token:
            continue
        text = token
        if prev is not None:
            gap = block.x - (prev.x + prev.width)
            em = max(prev.height, block.height, 0.01) * 0.25
            if gap > em:
                text = f" {token}"
        out.append((block, text))
        prev = block
    return out


def _cluster_blocks_into_lines(blocks: list[ExtractionBlock]) -> list[list[ExtractionBlock]]:
    if not blocks:
        return []
    heights = [b.height for b in blocks if b.height > 0]
    median_h = median(heights) if heights else 0.02
    y_tolerance = max(median_h * 0.5, 0.008)

    sorted_blocks = sorted(blocks, key=_line_center_y)
    lines: list[list[ExtractionBlock]] = []
    for block in sorted_blocks:
        cy = _line_center_y(block)
        matched: list[ExtractionBlock] | None = None
        for line in lines:
            line_cy = sum(_line_center_y(b) for b in line) / len(line)
            if abs(cy - line_cy) <= y_tolerance:
                matched = line
                break
        if matched is None:
            lines.append([block])
        else:
            matched.append(block)

    for line in lines:
        line.sort(key=lambda b: b.x)
    lines.sort(key=lambda line: min(_line_center_y(b) for b in line))
    return lines


def layout_ir_from_extraction_blocks(
    blocks: list[ExtractionBlock],
    *,
    width_pt: float = _DEFAULT_WIDTH_PT,
    height_pt: float = _DEFAULT_HEIGHT_PT,
    page_sizes_pt: dict[int, tuple[float, float]] | None = None,
) -> LayoutIrDocument | None:
    if not blocks:
        return None

    pages_set = sorted({b.page for b in blocks})
    pages: list[LayoutIrPage] = []
    total_blocks = 0
    truncated = False

    for page_num in pages_set:
        if len(pages) >= MAX_LAYOUT_PAGES:
            truncated = True
            break
        page_blocks_raw = [b for b in blocks if b.page == page_num]
        if page_sizes_pt:
            page_width, page_height = page_sizes_pt.get(page_num, (width_pt, height_pt))
        else:
            page_width, page_height = width_pt, height_pt
        ir_blocks: list[LayoutIrBlock] = []
        for line in _cluster_blocks_into_lines(page_blocks_raw):
            for block, text in _text_with_inter_word_spaces(line):
                if total_blocks >= MAX_LAYOUT_BLOCKS:
                    truncated = True
                    break
                if not text.strip():
                    continue
                anchor = block.block_index
                if anchor is None:
                    anchor = _index_of_block(blocks, block)
                ir_blocks.append(
                    LayoutIrBlock(
                        page=page_num,
                        x=block.x,
                        y=block.y,
                        width=block.width,
                        height=block.height,
                        text=text,
                        weight=FontWeight.NORMAL,
                        align=TextAlign.LEFT,
                        block_index=anchor,
                    )
                )
                total_blocks += 1
                if total_blocks > MAX_LAYOUT_ELEMENTS:
                    truncated = True
                    break
            if truncated:
                break
        if ir_blocks:
            pages.append(
                LayoutIrPage(
                    page=page_num,
                    width_pt=page_width,
                    height_pt=page_height,
                    blocks=tuple(ir_blocks),
                    tables=(),
                )
            )
        if truncated:
            break

    if truncated:
        _logger.warning("layout IR from blocks truncated to element limits")
    if not pages:
        return None
    return LayoutIrDocument(version=LAYOUT_IR_VERSION, pages=tuple(pages))


def _index_of_block(blocks: list[ExtractionBlock], target: ExtractionBlock) -> int | None:
    for i, b in enumerate(blocks):
        if (
            b.page == target.page
            and b.text == target.text
            and abs(b.x - target.x) < 1e-6  # noqa: PLR2004
            and abs(b.y - target.y) < 1e-6  # noqa: PLR2004
        ):
            return i
    return None
