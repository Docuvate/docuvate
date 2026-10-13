# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

FactKind = Literal["key_value", "amount", "date", "table_cell"]


@dataclass(frozen=True)
class FactProvenance:
    page: int | None
    x: float | None
    y: float | None
    width: float | None
    height: float | None
    char_start: int | None
    char_end: int | None


@dataclass(frozen=True)
class ExtractedFact:
    kind: FactKind
    predicate_key: str
    confidence: float
    provenance: FactProvenance
    value_text: str | None = None
    amount_numeric: float | None = None
    currency_code: str | None = None
    value_date_iso: str | None = None
    table_index: int | None = None
    row_index: int | None = None
    col_index: int | None = None


@dataclass(frozen=True)
class FactIndexBuildResult:
    facts: tuple[ExtractedFact, ...]
    wall_time_ms: float
