# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from dataclasses import dataclass


@dataclass(frozen=True)
class ExtractedField:
    key: str
    value: str
    confidence: float | None = None


@dataclass(frozen=True)
class ExtractionBlock:
    page: int
    x: float
    y: float
    width: float
    height: float
    text: str
    block_index: int | None = None


@dataclass(frozen=True)
class ExtractionResult:
    text: str
    fields: list[ExtractedField]
    blocks: list[ExtractionBlock] | None = None
    markdown: str | None = None
    layout_ir: dict[str, object] | None = None
