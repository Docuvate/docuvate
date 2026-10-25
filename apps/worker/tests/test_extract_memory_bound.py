# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import io
import resource
import sys
from unittest.mock import patch

from pypdf import PdfWriter

from docuvate_worker.application.cpu_document_pipeline.stages.ocr_stage import (
    _ocr_pdf_in_page_chunks,
)
from docuvate_worker.domain.models import ExtractionBlock


def _peak_rss_mib() -> float:
    usage = resource.getrusage(resource.RUSAGE_SELF)
    if sys.platform == "darwin":
        return usage.ru_maxrss / (1024 * 1024)
    return usage.ru_maxrss / 1024


def _many_page_blank_pdf(page_count: int) -> bytes:
    writer = PdfWriter()
    for _ in range(page_count):
        writer.add_blank_page(width=612, height=792)
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def test_chunked_pdf_ocr_peak_rss_bounded() -> None:
    page_count = 80
    pdf = _many_page_blank_pdf(page_count)

    def _fake_ocr(_content: bytes) -> tuple[str, list[ExtractionBlock]]:
        return ("x", [])

    baseline = _peak_rss_mib()
    with patch(
        "docuvate_worker.application.cpu_document_pipeline.stages.ocr_stage._ocr_pdf",
        side_effect=_fake_ocr,
    ):
        text, blocks = _ocr_pdf_in_page_chunks(pdf)
    peak = _peak_rss_mib()
    delta = peak - baseline
    assert "x" in text
    assert blocks == []
    assert delta < 256.0
