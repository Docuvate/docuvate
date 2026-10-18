# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass

from docuvate_worker.domain.layout_ir import LayoutIrDocument
from docuvate_worker.domain.models import ExtractionBlock


@dataclass(frozen=True)
class OfficeExtractResult:
    text: str
    blocks: tuple[ExtractionBlock, ...]
    layout_ir: LayoutIrDocument | None = None
    source: str = "office_born_digital"
