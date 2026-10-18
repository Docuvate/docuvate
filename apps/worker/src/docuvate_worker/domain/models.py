# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from docuvate_worker.domain.cpu_pipeline.contracts import CpuPipelineExtractionArtifacts
    from docuvate_worker.domain.exact_fact_index.types import ExtractedFact
    from docuvate_worker.domain.representation.encode import DocumentRepresentation


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
class ExtractedDocumentImage:
    page: int
    x: float
    y: float
    width: float
    height: float
    kind: str
    caption: str | None
    thumbnail_png: bytes


@dataclass(frozen=True)
class ExtractionResult:
    text: str
    fields: list[ExtractedField]
    field_suggestions: list[ExtractedField] | None = None
    blocks: list[ExtractionBlock] | None = None
    markdown: str | None = None
    layout_ir: dict[str, object] | None = None
    layout_reconstruction_reliable: bool | None = None
    layout_unreliable_reason: str | None = None
    cpu_pipeline: CpuPipelineExtractionArtifacts | None = None
    document_representation: DocumentRepresentation | None = None
    extracted_facts: tuple[ExtractedFact, ...] | None = None
    preview_pdf: bytes | None = None
    images: list[ExtractedDocumentImage] | None = None
