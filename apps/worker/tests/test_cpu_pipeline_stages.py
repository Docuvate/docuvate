# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import numpy as np

from docuvate_worker.application.cpu_document_pipeline.stages.fields_stage import run_fields_stage
from docuvate_worker.application.cpu_document_pipeline.stages.luna_stage import run_luna_stage
from docuvate_worker.application.cpu_document_pipeline.stages.nest_stage import run_nest_stage
from docuvate_worker.application.embedding_density import train_from_labeled_examples
from docuvate_worker.domain.cpu_pipeline.contracts import (
    PipelineMutableState,
    StageAvailability,
)
from docuvate_worker.domain.embedding_density.calibration import posterior_log_odds
from docuvate_worker.domain.embedding_density.schemas import (
    CalibrationThresholdPayload,
    EmbeddingDensityStatePayload,
)
from docuvate_worker.domain.models import ExtractionBlock
from docuvate_worker.domain.representation.constants import (
    ENCODER_ID,
    ENCODER_REVISION,
    REPRESENTATION_VERSION,
)
from docuvate_worker.domain.representation.encode import DocumentRepresentation
from docuvate_worker.domain.representation.quantize import quantize_vector
from docuvate_worker.infrastructure.fastembed_model import embed_passages


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
    keys = {s.key for s in envelope.data.suggestions}
    assert "amount" in keys


def test_luna_stage_leaves_block_coordinates_unchanged() -> None:
    block = ExtractionBlock(
        page=1, x=0.1, y=0.2, width=0.2, height=0.05, text="hello", block_index=0
    )
    state = PipelineMutableState(
        content=b"",
        mime_type="application/pdf",
        document_id=None,
        text="hello",
        blocks=[block],
    )
    envelope = run_luna_stage(state)
    assert envelope.availability == StageAvailability.NOT_AVAILABLE
    assert state.blocks[0].x == 0.1
    assert state.blocks[0].y == 0.2
    assert envelope.data.labels[0].review_suggested is True


def test_nest_stage_without_calibrated_state() -> None:
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


def test_nest_stage_classifies_with_calibrated_state() -> None:
    doc_text = "Delivery note ACME warehouse shipment manifest"
    anchor, other = embed_passages(
        [
            doc_text,
            "Unrelated quarterly earnings call transcript for investors",
        ]
    )
    dim = len(anchor)
    rng = np.random.default_rng(4)
    vectors: list[list[float]] = []
    labels: list[str] = []
    for _ in range(24):
        vectors.append((anchor + rng.normal(0, 0.02, dim)).tolist())
        labels.append("delivery")
    for _ in range(24):
        vectors.append((other + rng.normal(0, 0.02, dim)).tolist())
        labels.append("other")
    raw_state = train_from_labeled_examples(["delivery", "other"], vectors, labels)
    state_payload = EmbeddingDensityStatePayload.model_validate(raw_state.model_dump())
    state_payload.fine_ready = {"delivery": True, "other": False}
    state_payload.label_to_group = {"delivery": "g1", "other": "g1"}
    state_payload.novelty_threshold = float("-inf")
    log_odds_thr = posterior_log_odds(0.35)
    state_payload.fine_thresholds["delivery"] = CalibrationThresholdPayload(
        scope="fine",
        target_id="delivery",
        threshold=log_odds_thr,
        lower_bound=0.9,
        coverage=0.5,
    )

    mean_scale, mean_int8 = quantize_vector(anchor)
    max_scale, max_int8 = quantize_vector(anchor)
    document_representation = DocumentRepresentation(
        encoder_id=ENCODER_ID,
        encoder_revision=ENCODER_REVISION,
        representation_version=REPRESENTATION_VERSION,
        units=(),
        document_mean_scale=mean_scale,
        document_mean_int8=mean_int8,
        document_max_scale=max_scale,
        document_max_int8=max_int8,
        document_mean_float=tuple(anchor),
    )

    state = PipelineMutableState(
        content=b"",
        mime_type="application/pdf",
        document_id="doc-1",
        text=doc_text,
        blocks=[],
        embedding_density_state=state_payload,
        document_representation=document_representation,
    )
    envelope = run_nest_stage(state)
    assert envelope.availability == StageAvailability.OK
    assert envelope.data.label_id == "delivery"
    assert envelope.data.fine_suggest
    assert envelope.data.confidence > 0.5
