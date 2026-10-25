# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import resource
import shutil
import sys

import pytest

from docuvate_worker.application.extract import extract_document
from tests.public_domain_dense_scans import public_domain_dense_scan_pdf

pytestmark = pytest.mark.slow

_BENCHMARKS: tuple[tuple[str, int, int], ...] = (
    ("scan_20p", 20, 300),
    ("scan_35p", 35, 280),
    ("scan_50p", 50, 260),
)
_PEAK_BUDGET_MIB = 1536.0


def _peak_rss_mib() -> float:
    usage = resource.getrusage(resource.RUSAGE_SELF)
    if sys.platform == "darwin":
        return usage.ru_maxrss / (1024 * 1024)
    return usage.ru_maxrss / 1024


@pytest.mark.skipif(shutil.which("pdftoppm") is None, reason="poppler required for pdf2image")
@pytest.mark.parametrize("label,page_count,dpi", _BENCHMARKS)
def test_public_dense_scan_peak_rss_under_budget(
    label: str,
    page_count: int,
    dpi: int,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DOCUVATE_ALLOW_IN_PROCESS_EXTRACT", "1")
    monkeypatch.setenv("DOCUVATE_EXTRACT_SUBPROCESS", "0")
    monkeypatch.setenv("DOCUVATE_EXTRACT_ADMISSION", "0")
    monkeypatch.setenv("DOCUVATE_OCR_BACKEND", "rapidocr")
    monkeypatch.setenv("DOCUVATE_EXTRACT_PDF_CHUNK_PAGES", "8")
    monkeypatch.setenv("DOCUVATE_DOCAI_SHARE_ENCODER", "1")
    pdf = public_domain_dense_scan_pdf(page_count, dpi=dpi)
    size_mb = len(pdf) / (1024 * 1024)
    assert 1.0 <= size_mb <= 30.0, f"{label} pdf size {size_mb:.1f} MiB out of expected band"
    baseline = _peak_rss_mib()
    result = extract_document(pdf, "application/pdf", engine="pipeline")
    peak = _peak_rss_mib()
    delta = peak - baseline
    assert len(result.text) > 0
    assert delta < _PEAK_BUDGET_MIB, f"{label} peak delta {delta:.1f} MiB exceeds {_PEAK_BUDGET_MIB}"
