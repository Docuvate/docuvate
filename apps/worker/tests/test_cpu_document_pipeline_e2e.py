# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import json
from pathlib import Path

import numpy as np
import pytest

from docuvate_worker.application.cpu_document_pipeline.orchestrator import (
    run_integrated_cpu_document_pipeline,
)
from docuvate_worker.application.embedding_density import train_from_labeled_examples
from docuvate_worker.domain.cpu_pipeline.contracts import PipelineRunInput, StageAvailability
from docuvate_worker.domain.embedding_density.calibration import posterior_log_odds
from docuvate_worker.domain.embedding_density.schemas import (
    CalibrationThresholdPayload,
    EmbeddingDensityStatePayload,
)
from docuvate_worker.infrastructure.fastembed_model import embed_passages
from tests.synthetic_layout_pdfs import delivery_note_table_pdf, form_disclosure_pdf


@pytest.fixture(scope="module")
def latency_report_path(tmp_path_factory: pytest.TempPathFactory) -> Path:
    return tmp_path_factory.mktemp("pipeline_reports") / "stage-latency.json"


def _calibrated_state_for_text(doc_text: str) -> EmbeddingDensityStatePayload:
    anchor, other = embed_passages(
        [
            doc_text[:4000],
            "Generic unrelated document about cooking recipes and kitchen tools",
        ]
    )
    dim = len(anchor)
    rng = np.random.default_rng(9)
    vectors: list[list[float]] = []
    labels: list[str] = []
    for _ in range(30):
        vectors.append((anchor + rng.normal(0, 0.015, dim)).tolist())
        labels.append("doc")
    for _ in range(30):
        vectors.append((other + rng.normal(0, 0.015, dim)).tolist())
        labels.append("noise")
    raw = train_from_labeled_examples(["doc", "noise"], vectors, labels)
    payload = EmbeddingDensityStatePayload.model_validate(raw.model_dump())
    payload.novelty_threshold = float("-inf")
    payload.fine_ready = {"doc": True, "noise": False}
    log_odds_thr = posterior_log_odds(0.35)
    payload.fine_thresholds["doc"] = CalibrationThresholdPayload(
        scope="fine",
        target_id="doc",
        threshold=log_odds_thr,
        lower_bound=0.9,
        coverage=0.5,
    )
    return payload


def test_integrated_pipeline_e2e_delivery_note(latency_report_path: Path) -> None:
    content = delivery_note_table_pdf()
    result = run_integrated_cpu_document_pipeline(
        PipelineRunInput(content=content, mime_type="application/pdf", document_id="e2e-delivery")
    )
    assert result.ocr.availability == StageAvailability.OK
    assert result.ocr.data.source == "pdf_text_layer"
    assert "Item" in result.ocr.data.text
    assert result.taco.availability in {StageAvailability.OK, StageAvailability.FALLBACK}
    if result.taco.data.tables:
        table = result.taco.data.tables[0]
        assert table.header_row_count >= 1
        assert table.column_count >= 1
    assert result.fields.availability == StageAvailability.OK
    assert result.luna.availability == StageAvailability.NOT_AVAILABLE

    latencies = result.latency_report_ms()
    latency_report_path.write_text(json.dumps(latencies, indent=2) + "\n", encoding="utf-8")
    assert latencies["ocr"] > 0.0
    assert latencies["taco_tables"] >= 0.0


def test_integrated_pipeline_e2e_form_disclosure() -> None:
    content = form_disclosure_pdf()
    result = run_integrated_cpu_document_pipeline(
        PipelineRunInput(content=content, mime_type="application/pdf")
    )
    assert result.ocr.availability == StageAvailability.OK
    assert "Label" in result.ocr.data.text


def test_integrated_pipeline_nest_with_calibrated_fixture() -> None:
    content = form_disclosure_pdf()
    result = run_integrated_cpu_document_pipeline(
        PipelineRunInput(content=content, mime_type="application/pdf")
    )
    doc_text = result.ocr.data.text
    calibrated = _calibrated_state_for_text(doc_text)
    nested = run_integrated_cpu_document_pipeline(
        PipelineRunInput(
            content=content,
            mime_type="application/pdf",
            embedding_density_state=calibrated,
        )
    )
    assert nested.nest.availability == StageAvailability.OK
    assert nested.nest.data.label_id == "doc"
    assert nested.nest.data.fine_suggest or nested.nest.data.coarse_auto_apply
    assert nested.nest.data.confidence > 0.4


def test_kite_index_builds_representation_unit_chunks_when_embeddings_available() -> None:
    content = delivery_note_table_pdf()
    result = run_integrated_cpu_document_pipeline(
        PipelineRunInput(content=content, mime_type="application/pdf")
    )
    if result.kite_index.availability == StageAvailability.NOT_AVAILABLE:
        pytest.skip("fastembed model unavailable in this environment")
    chunks = result.kite_index.data.chunks
    assert len(chunks) >= 2
    levels = {c.level for c in chunks}
    assert "document" in levels
    assert levels & {"paragraph", "table_row"}
    assert result.kite_index.data.candidate_reader_available is False
