# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Cap encoding units for very large scans."""

from __future__ import annotations

import os

from docuvate_worker.domain.representation.units import RepresentationUnit


def representation_max_units() -> int:
    raw = os.environ.get("DOCUVATE_REPRESENTATION_MAX_UNITS", "384").strip()
    if not raw.isdigit():
        return 384
    return max(32, int(raw))


def cap_representation_units(units: list[RepresentationUnit]) -> list[RepresentationUnit]:
    limit = representation_max_units()
    if len(units) <= limit:
        return units
    # Keep table rows and longer paragraphs; drop shortest paragraph-like units first.
    ranked = sorted(
        enumerate(units),
        key=lambda pair: (0 if pair[1].kind == "table_row" else 1, len(pair[1].text)),
    )
    keep_indices = {index for index, _ in ranked[-limit:]}
    trimmed = [unit for index, unit in enumerate(units) if index in keep_indices]
    return [
        RepresentationUnit(
            unit_index=idx,
            kind=unit.kind,
            text=unit.text,
            page=unit.page,
            x=unit.x,
            y=unit.y,
            width=unit.width,
            height=unit.height,
            char_start=unit.char_start,
            char_end=unit.char_end,
        )
        for idx, unit in enumerate(trimmed)
    ]
