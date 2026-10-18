# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""TACO-style header row count via body prediction error (CPU)."""

from __future__ import annotations

from docuvate_worker.domain.layout_ir import LayoutIrTable


def _row_widths(table: LayoutIrTable) -> list[int]:
    return [len(row) for row in table.rows]


def infer_header_row_count(table: LayoutIrTable, *, max_header_rows: int = 3) -> tuple[int, str]:
    widths = _row_widths(table)
    if len(widths) < 2:
        return 1, "fallback_single_row"
    best_h = 1
    best_error = float("inf")
    limit = min(max_header_rows, len(widths) - 1)
    for h in range(1, limit + 1):
        body = widths[h:]
        if not body:
            continue
        mode = max(set(body), key=body.count)
        header_width = widths[h - 1]
        mismatch = sum(1 for w in body if w != mode)
        if header_width != mode:
            mismatch += abs(header_width - mode)
        if mismatch < best_error:
            best_error = mismatch
            best_h = h
    return best_h, "prediction_error"
