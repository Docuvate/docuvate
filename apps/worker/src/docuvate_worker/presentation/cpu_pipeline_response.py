# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from docuvate_worker.domain.cpu_pipeline.contracts import CpuPipelineExtractionArtifacts
from docuvate_worker.presentation.schemas import (
    CpuPipelineExtractModel,
    KiteIndexChunkModel,
    KiteIndexStageModel,
    NestStageModel,
    TacoSpanSuggestionModel,
    TacoStageModel,
    TacoTableModel,
)


def cpu_pipeline_to_response(
    artifacts: CpuPipelineExtractionArtifacts | None,
) -> CpuPipelineExtractModel | None:
    if artifacts is None:
        return None
    taco_tables = [
        TacoTableModel(
            table_index=t.table_index,
            column_count=t.column_count,
            header_row_count=t.header_row_count,
            header_method=t.header_method,
            span_suggestions=[
                TacoSpanSuggestionModel(
                    row=s.row,
                    col=s.col,
                    row_span=s.row_span,
                    col_span=s.col_span,
                    confidence=s.confidence,
                )
                for s in t.span_suggestions
            ],
        )
        for t in artifacts.taco.tables
    ]
    kite_chunks = [
        KiteIndexChunkModel(
            chunk_id=c.chunk_id,
            level=c.level,
            text=c.text,
            embedding_dim=c.embedding_dim,
        )
        for c in artifacts.kite_index.chunks
    ]
    return CpuPipelineExtractModel(
        taco=TacoStageModel(
            availability=artifacts.taco_availability.value,
            tables=taco_tables,
        ),
        nest=NestStageModel(
            availability=artifacts.nest_availability.value,
            label_id=artifacts.nest.label_id,
            group_id=artifacts.nest.group_id,
            confidence=artifacts.nest.confidence,
            novel=artifacts.nest.novel,
            coarse_auto_apply=artifacts.nest.coarse_auto_apply,
            fine_suggest=artifacts.nest.fine_suggest,
        ),
        kite_index=KiteIndexStageModel(
            availability=artifacts.kite_index_availability.value,
            chunks=kite_chunks,
            candidate_reader_available=artifacts.kite_index.candidate_reader_available,
        ),
    )
