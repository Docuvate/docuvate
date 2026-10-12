# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Orchestrates the integrated CPU document pipeline for one upload."""

from __future__ import annotations

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


def run_integrated_cpu_document_pipeline(
    run_input: PipelineRunInput,
) -> IntegratedPipelineResult:
    density_port = StaticEmbeddingDensityStatePort(run_input.embedding_density_state)
    state = PipelineMutableState(
        content=run_input.content,
        mime_type=run_input.mime_type,
        document_id=run_input.document_id,
        embedding_density_state=density_port.resolve(run_input.document_id),
    )
    ocr = run_ocr_stage(state)
    rotation = run_rotation_stage(state)
    luna = run_luna_stage(state)
    state.luna_data = luna.data
    taco = run_taco_stage(state)
    state.taco_data = taco.data
    representation = run_representation_stage(state)
    nest = run_nest_stage(state)
    fields = run_fields_stage(state)
    kite_index = run_kite_index_stage(state)
    return IntegratedPipelineResult(
        ocr=ocr,
        rotation=rotation,
        luna=luna,
        taco=taco,
        representation=representation,
        nest=nest,
        fields=fields,
        kite_index=kite_index,
    )
