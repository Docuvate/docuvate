# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from docuvate_worker.application.cpu_document_pipeline.orchestrator import (
    run_integrated_cpu_document_pipeline,
)
from docuvate_worker.domain.cpu_pipeline.contracts import PipelineRunInput
from docuvate_worker.infrastructure.embedding_encoder_stats import (
    passage_batch_calls,
    reset_passage_batch_calls,
)
from tests.synthetic_layout_pdfs import delivery_note_table_pdf


def test_single_encoder_batch_per_extract_pipeline() -> None:
    reset_passage_batch_calls()
    pdf = delivery_note_table_pdf()
    run_integrated_cpu_document_pipeline(
        PipelineRunInput(content=pdf, mime_type="application/pdf", document_id="doc-1")
    )
    assert passage_batch_calls() == 1
