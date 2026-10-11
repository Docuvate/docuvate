# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from docuvate_worker.application.cpu_document_pipeline.stages.fields_stage import run_fields_stage
from docuvate_worker.application.cpu_document_pipeline.stages.luna_stage import run_luna_stage
from docuvate_worker.application.cpu_document_pipeline.stages.nest_stage import run_nest_stage
from docuvate_worker.domain.cpu_pipeline.contracts import (
    PipelineMutableState,
    StageAvailability,
)
from docuvate_worker.domain.models import ExtractionBlock


def test_fields_stage_emits_heuristic_suggestions() -> None:
    state = PipelineMutableState(
        content=b"",
        mime_type="application/pdf",
        document_id=None,
        text="Rechnung\nBetrag: 1.234,56 EUR\n",
        blocks=[],
    )
    envelope = run_fields_stage(state)
    assert envelope.availability == StageAvailability.OK
    assert envelope.data.suggestions


def test_luna_stage_normalizes_without_classifier_weights() -> None:
    state = PipelineMutableState(
        content=b"",
        mime_type="application/pdf",
        document_id=None,
        text="hello",
        blocks=[
            ExtractionBlock(page=1, x=0.1, y=0.2, width=0.2, height=0.05, text="hello", block_index=0),
        ],
    )
    envelope = run_luna_stage(state)
    assert envelope.availability == StageAvailability.NOT_AVAILABLE
    assert envelope.data.blocks
    assert envelope.data.blocks[0].x >= 0.0


def test_nest_stage_without_state_path() -> None:
    state = PipelineMutableState(
        content=b"",
        mime_type="application/pdf",
        document_id=None,
        text="Document body",
        blocks=[],
    )
    envelope = run_nest_stage(state)
    assert envelope.availability == StageAvailability.NOT_AVAILABLE
    assert envelope.data.label_id is None
