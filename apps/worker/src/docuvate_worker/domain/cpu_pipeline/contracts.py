# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Typed contracts for the integrated CPU document pipeline (section 2 design)."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import TYPE_CHECKING

from docuvate_worker.domain.embedding_density.schemas import EmbeddingDensityStatePayload
from docuvate_worker.domain.models import ExtractedField, ExtractionBlock

if TYPE_CHECKING:
    from docuvate_worker.domain.representation.encode import DocumentRepresentation


class StageAvailability(StrEnum):
    OK = "ok"
    NOT_AVAILABLE = "not_available"
    FALLBACK = "fallback"
    UNCERTAIN = "uncertain"


@dataclass(frozen=True)
class StageMetrics:
    wall_time_ms: float
    peak_rss_bytes: int | None


@dataclass(frozen=True)
class StageEnvelope[T]:
    stage_id: str
    availability: StageAvailability
    metrics: StageMetrics
    data: T
    detail: str | None = None


@dataclass(frozen=True)
class OcrStageData:
    text: str
    blocks: tuple[ExtractionBlock, ...]
    source: str


@dataclass(frozen=True)
class RotationStageData:
    blocks: tuple[ExtractionBlock, ...]
    page_rotations_deg: tuple[float, ...]
    correction_applied: bool


@dataclass(frozen=True)
class LunaBlockLabel:
    block_index: int
    label: str | None
    confidence: float
    auto_apply: bool
    review_suggested: bool


@dataclass(frozen=True)
class LunaStageData:
    labels: tuple[LunaBlockLabel, ...]


@dataclass(frozen=True)
class TacoSpanSuggestion:
    row: int
    col: int
    row_span: int
    col_span: int
    confidence: float


@dataclass(frozen=True)
class TacoTableResult:
    table_index: int
    column_count: int
    header_row_count: int
    header_method: str
    span_suggestions: tuple[TacoSpanSuggestion, ...]


@dataclass(frozen=True)
class TacoStageData:
    tables: tuple[TacoTableResult, ...]


@dataclass(frozen=True)
class NestStageData:
    label_id: str | None
    group_id: str | None
    confidence: float
    novel: bool
    coarse_auto_apply: bool
    fine_suggest: bool


@dataclass(frozen=True)
class FieldSuggestionsStageData:
    suggestions: tuple[ExtractedField, ...]


@dataclass(frozen=True)
class KiteIndexChunk:
    chunk_id: str
    level: str
    text: str
    embedding_dim: int


@dataclass(frozen=True)
class KiteIndexStageData:
    chunks: tuple[KiteIndexChunk, ...]
    candidate_reader_available: bool


@dataclass(frozen=True)
class RepresentationStageData:
    representation: DocumentRepresentation | None


@dataclass(frozen=True)
class IntegratedPipelineResult:
    ocr: StageEnvelope[OcrStageData]
    rotation: StageEnvelope[RotationStageData]
    luna: StageEnvelope[LunaStageData]
    taco: StageEnvelope[TacoStageData]
    nest: StageEnvelope[NestStageData]
    fields: StageEnvelope[FieldSuggestionsStageData]
    kite_index: StageEnvelope[KiteIndexStageData]
    representation: StageEnvelope[RepresentationStageData]

    def latency_report_ms(self) -> dict[str, float]:
        return {
            self.ocr.stage_id: self.ocr.metrics.wall_time_ms,
            self.rotation.stage_id: self.rotation.metrics.wall_time_ms,
            self.luna.stage_id: self.luna.metrics.wall_time_ms,
            self.taco.stage_id: self.taco.metrics.wall_time_ms,
            self.representation.stage_id: self.representation.metrics.wall_time_ms,
            self.nest.stage_id: self.nest.metrics.wall_time_ms,
            self.fields.stage_id: self.fields.metrics.wall_time_ms,
            self.kite_index.stage_id: self.kite_index.metrics.wall_time_ms,
        }


@dataclass(frozen=True)
class PipelineRunInput:
    content: bytes
    mime_type: str
    document_id: str | None = None
    embedding_density_state: EmbeddingDensityStatePayload | None = None
    layout_key_value_roles: bool = False
    recognized_field_keys: frozenset[str] = frozenset()


@dataclass
class PipelineMutableState:
    content: bytes
    mime_type: str
    document_id: str | None
    text: str = ""
    blocks: list[ExtractionBlock] = field(default_factory=list)
    embedding_density_state: EmbeddingDensityStatePayload | None = None
    layout_key_value_roles: bool = False
    recognized_field_keys: frozenset[str] = field(default_factory=frozenset)
    luna_data: LunaStageData = field(default_factory=lambda: LunaStageData(labels=()))
    taco_data: TacoStageData = field(default_factory=lambda: TacoStageData(tables=()))
    document_representation: DocumentRepresentation | None = None


@dataclass(frozen=True)
class CpuPipelineExtractionArtifacts:
    taco_availability: StageAvailability
    taco: TacoStageData
    nest_availability: StageAvailability
    nest: NestStageData
    kite_index_availability: StageAvailability
    kite_index: KiteIndexStageData
    representation_availability: StageAvailability
    representation: RepresentationStageData
