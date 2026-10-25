# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import os
import resource
import shutil
import sys

import pytest

from docuvate_worker.application.extract import extract_document
from tests.synthetic_scan_pdfs import scanned_image_only_multipage_pdf

pytestmark = pytest.mark.slow


def _peak_rss_mib() -> float:
    usage = resource.getrusage(resource.RUSAGE_SELF)
    if sys.platform == "darwin":
        return usage.ru_maxrss / (1024 * 1024)
    return usage.ru_maxrss / 1024


@pytest.mark.skipif(shutil.which("pdftoppm") is None, reason="poppler required for pdf2image")
def test_fifty_page_scan_peak_rss_under_budget(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DOCUVATE_ALLOW_IN_PROCESS_EXTRACT", "1")
    monkeypatch.setenv("DOCUVATE_EXTRACT_SUBPROCESS", "0")
    monkeypatch.setenv("DOCUVATE_EXTRACT_ADMISSION", "0")
    monkeypatch.setenv("DOCUVATE_OCR_BACKEND", "rapidocr")
    monkeypatch.setenv("DOCUVATE_EXTRACT_PDF_CHUNK_PAGES", "8")
    pdf = scanned_image_only_multipage_pdf(page_count=50, dpi=300)
    baseline = _peak_rss_mib()
    result = extract_document(pdf, "application/pdf", engine="pipeline")
    peak = _peak_rss_mib()
    delta = peak - baseline
    assert len(result.text) > 0
    assert delta < 1536.0
