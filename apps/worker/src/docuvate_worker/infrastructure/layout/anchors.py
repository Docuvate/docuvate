# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Align layout IR block_index values with worker ExtractionBlock array indices."""

from __future__ import annotations

from docuvate_worker.domain.layout_ir import (
    LayoutIrBlock,
    LayoutIrDocument,
    LayoutIrLine,
    LayoutIrPage,
    LayoutIrTable,
    LayoutIrTableCell,
)
from docuvate_worker.domain.models import ExtractionBlock
from docuvate_worker.infrastructure.layout.line_cluster import cluster_blocks_into_lines

_LINE_Y_TOLERANCE = 0.014


def _centers_overlap_box(
    ext: ExtractionBlock, x: float, y: float, width: float, height: float, page: int
) -> bool:
    if ext.page != page:
        return False
    cx = ext.x + ext.width / 2
    cy = ext.y + ext.height / 2
    return x <= cx <= x + width and y <= cy <= y + height


def _anchor_index(
    extraction_blocks: list[ExtractionBlock],
    page: int,
    x: float,
    y: float,
    width: float,
    height: float,
    text: str,
    fallback: int | None,
) -> int | None:
    indices = [
        i
        for i, ext in enumerate(extraction_blocks)
        if _centers_overlap_box(ext, x, y, width, height, page)
    ]
    if not indices:
        indices = [
            i
            for i, ext in enumerate(extraction_blocks)
            if ext.page == page
            and ext.text.strip() == text.strip()
            and abs(ext.y - y) <= _LINE_Y_TOLERANCE
        ]
    if indices:
        return min(indices)
    return fallback


def anchor_layout_to_extraction_blocks(
    doc: LayoutIrDocument, extraction_blocks: list[ExtractionBlock] | None
) -> LayoutIrDocument:
    if not extraction_blocks:
        return doc

    pages: list[LayoutIrPage] = []
    for page in doc.pages:
        anchored: list[LayoutIrBlock] = []
        for layout_block in page.blocks:
            anchor = _anchor_index(
                extraction_blocks,
                layout_block.page,
                layout_block.x,
                layout_block.y,
                layout_block.width,
                layout_block.height,
                layout_block.text,
                layout_block.block_index,
            )
            anchored.append(
                LayoutIrBlock(
                    page=layout_block.page,
                    x=layout_block.x,
                    y=layout_block.y,
                    width=layout_block.width,
                    height=layout_block.height,
                    text=layout_block.text,
                    font_family=layout_block.font_family,
                    font_size_pt=layout_block.font_size_pt,
                    weight=layout_block.weight,
                    align=layout_block.align,
                    column_index=layout_block.column_index,
                    block_index=anchor,
                )
            )

        anchored_tables: list[LayoutIrTable] = []
        for table in page.tables:
            new_rows: list[tuple[LayoutIrTableCell, ...]] = []
            for row in table.rows:
                cells: list[LayoutIrTableCell] = []
                for cell in row:
                    anchor = _anchor_index(
                        extraction_blocks,
                        table.page,
                        cell.x,
                        cell.y,
                        cell.width,
                        cell.height,
                        cell.text,
                        cell.block_index,
                    )
                    cells.append(
                        LayoutIrTableCell(
                            text=cell.text,
                            x=cell.x,
                            y=cell.y,
                            width=cell.width,
                            height=cell.height,
                            font_size_pt=cell.font_size_pt,
                            weight=cell.weight,
                            block_index=anchor,
                            cell_role=cell.cell_role,
                        )
                    )
                new_rows.append(tuple(cells))
            anchored_tables.append(
                LayoutIrTable(
                    page=table.page,
                    x=table.x,
                    y=table.y,
                    width=table.width,
                    height=table.height,
                    rows=tuple(new_rows),
                    column_count=table.column_count,
                )
            )

        anchored_lines: list[LayoutIrLine] = []
        for line in page.lines:
            anchor = _anchor_index(
                extraction_blocks,
                line.page,
                line.x,
                line.y,
                line.width,
                line.height,
                line.text,
                line.block_index,
            )
            anchored_lines.append(
                LayoutIrLine(
                    page=line.page,
                    x=line.x,
                    y=line.y,
                    width=line.width,
                    height=line.height,
                    text=line.text,
                    font_family=line.font_family,
                    font_size_pt=line.font_size_pt,
                    weight=line.weight,
                    align=line.align,
                    block_index=anchor,
                )
            )
        if not anchored_lines and anchored:
            anchored_lines = cluster_blocks_into_lines(anchored)

        pages.append(
            LayoutIrPage(
                page=page.page,
                width_pt=page.width_pt,
                height_pt=page.height_pt,
                blocks=tuple(anchored),
                lines=tuple(anchored_lines),
                tables=tuple(anchored_tables),
                vectors=page.vectors,
            )
        )
    return LayoutIrDocument(version=doc.version, pages=tuple(pages))
