# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Typst layout export modes."""

from __future__ import annotations

from enum import StrEnum


class TypstExportMode(StrEnum):
    EXAKT = "exakt"
    SEMANTISCH = "semantisch"


def parse_typst_export_mode(value: str | None) -> TypstExportMode:
    if value is None or value == "":
        return TypstExportMode.EXAKT
    normalized = value.strip().lower()
    try:
        return TypstExportMode(normalized)
    except ValueError:
        raise ValueError(f"Unsupported typst export mode: {value}") from None
