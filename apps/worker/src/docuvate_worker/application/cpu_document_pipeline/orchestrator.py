# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Orchestrates the integrated CPU document pipeline for one upload."""

from __future__ import annotations

from docuvate_worker.application.cpu_document_pipeline.stages.exact_fact_index_stage import (
    run_exact_fact_index_stage,
)
from docuvate_worker.application.cpu_document_pipeline.stages.fields_stage import run_fields_stage
from docuvate_worker.application.cpu_document_pipeline.stages.kite_index_stage import (
    run_kite_index_stage,
)
from docuvate_worker.application.cpu_document_pipeline.stages.luna_stage import run_luna_stage
from docuvate_worker.application.cpu_document_pipeline.stages.nest_stage import run_nest_stage
from docuvate_worker.application.cpu_document_pipeline.stages.ocr_stage import run_ocr_stage
from docuvate_worker.application.cpu_document_pipeline.stages.representation_stage import (
    run_representation_stage,
)
from docuvate_worker.application.cpu_document_pipeline.stages.rotation_stage import (
    run_rotation_stage,
)
from docuvate_worker.application.cpu_document_pipeline.stages.taco_stage import run_taco_stage
from docuvate_worker.domain.cpu_pipeline.contracts import (
    IntegratedPipelineResult,
    PipelineMutableState,
    PipelineRunInput,
)
from docuvate_worker.domain.cpu_pipeline.embedding_density_port import (
    StaticEmbeddingDensityStatePort,
)
from docuvate_worker.infrastructure.extract_memory.profiling import (
    ExtractMemoryStage,
    active_memory_profiler,
)


def run_integrated_cpu_document_pipeline(
    run_input: PipelineRunInput,
) -> IntegratedPipelineResult:
    profiler = active_memory_profiler()
    density_port = StaticEmbeddingDensityStatePort(run_input.embedding_density_state)
    state = PipelineMutableState(
        content=run_input.content,
        mime_type=run_input.mime_type,
        document_id=run_input.document_id,
        embedding_density_state=density_port.resolve(run_input.document_id),
        layout_key_value_roles=run_input.layout_key_value_roles,
        recognized_field_keys=run_input.recognized_field_keys,
    )
    if profiler is not None and run_input.mime_type == "application/pdf":
        from docuvate_worker.infrastructure.extractors.pdf_chunk_extract import (  # noqa: PLC0415
            pdf_page_count,
        )

        with profiler.stage(ExtractMemoryStage.PDF_OPEN):
            pdf_page_count(run_input.content)
    if profiler is not None:
        with profiler.stage(ExtractMemoryStage.OCR):
            ocr = run_ocr_stage(state)
    else:
        ocr = run_ocr_stage(state)
    rotation = run_rotation_stage(state)
    if profiler is not None:
        with profiler.stage(ExtractMemoryStage.LAYOUT):
            luna = run_luna_stage(state)
    else:
        luna = run_luna_stage(state)
    state.luna_data = luna.data
    taco = run_taco_stage(state)
    state.taco_data = taco.data
    if profiler is not None:
        with profiler.stage(ExtractMemoryStage.EMBEDDING):
            representation = run_representation_stage(state)
    else:
        representation = run_representation_stage(state)
    nest = run_nest_stage(state)
    if profiler is not None:
        with profiler.stage(ExtractMemoryStage.FIELD_EXTRACTION):
            fields = run_fields_stage(state)
    else:
        fields = run_fields_stage(state)
    kite_index = run_kite_index_stage(state)
    exact_fact_index = run_exact_fact_index_stage(
        state, enabled=run_input.build_exact_fact_index
    )
    return IntegratedPipelineResult(
        ocr=ocr,
        rotation=rotation,
        luna=luna,
        taco=taco,
        representation=representation,
        nest=nest,
        fields=fields,
        kite_index=kite_index,
        exact_fact_index=exact_fact_index,
        prebuilt_layout_ir=state.prebuilt_layout_ir,
        preview_pdf=state.preview_pdf,
    )
