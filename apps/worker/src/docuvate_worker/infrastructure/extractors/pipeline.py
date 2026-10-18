# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import logging

from docuvate_worker.application.cpu_document_pipeline.orchestrator import (
    run_integrated_cpu_document_pipeline,
)
from docuvate_worker.domain.cpu_pipeline.contracts import (
    CpuPipelineExtractionArtifacts,
    IntegratedPipelineResult,
    PipelineRunInput,
)
from docuvate_worker.domain.embedding_density.schemas import EmbeddingDensityStatePayload
from docuvate_worker.domain.models import ExtractionResult
from docuvate_worker.domain.ports import ExtractorEngine
from docuvate_worker.domain.representation.encode import DocumentRepresentation
from docuvate_worker.infrastructure.office.mimes import is_pipeline_supported_mime

logger = logging.getLogger(__name__)


def extract_with_cpu_pipeline(
    content: bytes,
    mime_type: str,
    *,
    document_id: str | None = None,
    embedding_density_state: EmbeddingDensityStatePayload | None = None,
    build_exact_fact_index: bool = False,
) -> ExtractionResult:
    integrated = run_integrated_cpu_document_pipeline(
        PipelineRunInput(
            content=content,
            mime_type=mime_type,
            document_id=document_id,
            embedding_density_state=embedding_density_state,
            build_exact_fact_index=build_exact_fact_index,
        )
    )
    ocr = integrated.ocr.data
    logger.info(
        "CPU pipeline OCR source=%s chars=%d blocks=%d latencies_ms=%s",
        ocr.source,
        len(ocr.text),
        len(ocr.blocks),
        integrated.latency_report_ms(),
    )
    blocks = list(ocr.blocks) or None
    layout_ir_json: dict[str, object] | None = None
    if integrated.prebuilt_layout_ir is not None:
        layout_ir_json = integrated.prebuilt_layout_ir.to_json()
    return ExtractionResult(
        text=ocr.text,
        fields=[],
        field_suggestions=list(integrated.fields.data.suggestions),
        blocks=blocks,
        layout_ir=layout_ir_json,
        preview_pdf=integrated.preview_pdf,
        cpu_pipeline=CpuPipelineExtractionArtifacts(
            taco_availability=integrated.taco.availability,
            taco=integrated.taco.data,
            nest_availability=integrated.nest.availability,
            nest=integrated.nest.data,
            kite_index_availability=integrated.kite_index.availability,
            kite_index=integrated.kite_index.data,
            representation_availability=integrated.representation.availability,
            representation=integrated.representation.data,
        ),
        document_representation=state_representation(integrated),
        extracted_facts=integrated.exact_fact_index.data.facts
        if build_exact_fact_index
        else None,
    )


def state_representation(integrated: IntegratedPipelineResult) -> DocumentRepresentation | None:
    return integrated.representation.data.representation


class PipelineExtractor(ExtractorEngine):
    """Born-digital PDF and office formats first, then PaddleOCR for scans."""

    name = "pipeline"

    def supports(self, mime_type: str) -> bool:
        return is_pipeline_supported_mime(mime_type)

    def extract(self, content: bytes, mime_type: str) -> ExtractionResult:
        return extract_with_cpu_pipeline(content, mime_type)
