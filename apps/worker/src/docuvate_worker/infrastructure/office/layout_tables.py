# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from docuvate_worker.domain.layout_ir import (
    LAYOUT_IR_VERSION,
    FontWeight,
    LayoutIrCellRole,
    LayoutIrDocument,
    LayoutIrPage,
    LayoutIrTable,
    LayoutIrTableCell,
)


def layout_ir_from_grid(
    sheet_name: str,
    rows: list[list[str]],
    *,
    page: int = 1,
) -> LayoutIrDocument:
    width_pt = 792.0
    height_pt = 612.0
    if not rows:
        return LayoutIrDocument(version=LAYOUT_IR_VERSION, pages=())
    max_cols = max(len(r) for r in rows)
    row_count = len(rows)
    table_x = 0.05
    table_y = 0.08
    table_w = 0.9
    table_h = min(0.82, 0.08 + row_count * 0.04)
    cell_w = table_w / max(max_cols, 1)
    cell_h = table_h / max(row_count, 1)
    table_rows: list[tuple[LayoutIrTableCell, ...]] = []
    for ri, row in enumerate(rows):
        cells: list[LayoutIrTableCell] = []
        for ci in range(max_cols):
            text = row[ci].strip() if ci < len(row) else ""
            role = LayoutIrCellRole.HEADER if ri == 0 else None
            weight = FontWeight.BOLD if ri == 0 else FontWeight.NORMAL
            cells.append(
                LayoutIrTableCell(
                    text=text,
                    x=table_x + ci * cell_w,
                    y=table_y + ri * cell_h,
                    width=cell_w,
                    height=cell_h,
                    weight=weight,
                    cell_role=role,
                )
            )
        table_rows.append(tuple(cells))
    table = LayoutIrTable(
        page=page,
        x=table_x,
        y=table_y,
        width=table_w,
        height=table_h,
        rows=tuple(table_rows),
        column_count=max_cols,
    )
    title = sheet_name.strip() or "Sheet"
    page_obj = LayoutIrPage(
        page=page,
        width_pt=width_pt,
        height_pt=height_pt,
        blocks=(),
        lines=(),
        tables=(table,),
        vectors=(),
        widgets=(),
    )
    _ = title
    return LayoutIrDocument(version=LAYOUT_IR_VERSION, pages=(page_obj,))
