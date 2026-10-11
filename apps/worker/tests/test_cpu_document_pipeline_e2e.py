# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import json
from pathlib import Path

import pytest

from docuvate_worker.application.cpu_document_pipeline.orchestrator import (
    run_integrated_cpu_document_pipeline,
)
from docuvate_worker.domain.cpu_pipeline.contracts import PipelineRunInput, StageAvailability
from tests.synthetic_layout_pdfs import delivery_note_table_pdf, form_disclosure_pdf


@pytest.fixture(scope="module")
def latency_report_path(tmp_path_factory: pytest.TempPathFactory) -> Path:
    return tmp_path_factory.mktemp("pipeline_reports") / "stage-latency.json"


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
        assert result.taco.data.tables[0].header_row_count >= 1
    assert result.fields.availability == StageAvailability.OK
    assert result.luna.availability == StageAvailability.NOT_AVAILABLE
    assert result.nest.availability in {
        StageAvailability.NOT_AVAILABLE,
        StageAvailability.UNCERTAIN,
    }

    latencies = result.latency_report_ms()
    latency_report_path.write_text(json.dumps(latencies, indent=2) + "\n", encoding="utf-8")
    assert latencies["ocr"] >= 0.0
    assert latencies["taco_tables"] >= 0.0
    assert sum(latencies.values()) >= 0.0


def test_integrated_pipeline_e2e_form_disclosure() -> None:
    content = form_disclosure_pdf()
    result = run_integrated_cpu_document_pipeline(
        PipelineRunInput(content=content, mime_type="application/pdf")
    )
    assert result.ocr.availability == StageAvailability.OK
    assert any("Label" in result.ocr.data.text for _ in [0])


def test_kite_index_builds_sentence_chunks_when_embeddings_available() -> None:
    content = delivery_note_table_pdf()
    result = run_integrated_cpu_document_pipeline(
        PipelineRunInput(content=content, mime_type="application/pdf")
    )
    if result.kite_index.availability == StageAvailability.NOT_AVAILABLE:
        pytest.skip("fastembed model unavailable in this environment")
    assert result.kite_index.data.chunks
    assert result.kite_index.data.candidate_reader_available is False
