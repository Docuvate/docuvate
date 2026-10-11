# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import logging

from docuvate_worker.application.cpu_document_pipeline.orchestrator import (
    run_integrated_cpu_document_pipeline,
)
from docuvate_worker.domain.cpu_pipeline.contracts import PipelineRunInput
from docuvate_worker.domain.models import ExtractionResult
from docuvate_worker.domain.ports import ExtractorEngine

logger = logging.getLogger(__name__)


class PipelineExtractor(ExtractorEngine):
    """Born-digital PDF text first, then PaddleOCR; runs the integrated CPU analysis chain."""

    name = "pipeline"

    def supports(self, mime_type: str) -> bool:
        return mime_type.startswith("image/") or mime_type == "application/pdf"

    def extract(self, content: bytes, mime_type: str) -> ExtractionResult:
        integrated = run_integrated_cpu_document_pipeline(
            PipelineRunInput(content=content, mime_type=mime_type)
        )
        ocr = integrated.ocr.data
        logger.info(
            "CPU pipeline OCR source=%s chars=%d blocks=%d latencies_ms=%s",
            ocr.source,
            len(ocr.text),
            len(ocr.blocks),
            integrated.latency_report_ms(),
        )
        return ExtractionResult(
            text=ocr.text,
            fields=[],
            field_suggestions=list(integrated.fields.data.suggestions),
            blocks=list(integrated.luna.data.blocks) or None,
        )
