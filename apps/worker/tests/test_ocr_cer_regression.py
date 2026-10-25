# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import shutil

import pytest

from docuvate_worker.infrastructure.extractors.rapidocr_engine import ocr_pdf_bytes
from tests.synthetic_scan_pdfs import scanned_image_only_pdf

_REFERENCE_SNIPPET = "Raster-only label"
_BASELINE_CER = 0.12
_MAX_CER_REGRESSION_PP = 0.005


def _character_error_rate(reference: str, hypothesis: str) -> float:
    if not reference:
        return 0.0 if not hypothesis else 1.0
    ref = list(reference)
    hyp = list(hypothesis)
    rows = len(ref) + 1
    cols = len(hyp) + 1
    dist = [[0] * cols for _ in range(rows)]
    for i in range(rows):
        dist[i][0] = i
    for j in range(cols):
        dist[0][j] = j
    for i in range(1, rows):
        for j in range(1, cols):
            cost = 0 if ref[i - 1] == hyp[j - 1] else 1
            dist[i][j] = min(
                dist[i - 1][j] + 1,
                dist[i][j - 1] + 1,
                dist[i - 1][j - 1] + cost,
            )
    return dist[rows - 1][cols - 1] / len(ref)


@pytest.mark.skipif(shutil.which("pdftoppm") is None, reason="poppler required for pdf raster")
def test_rapidocr_cer_not_regressed_on_fixture(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DOCUVATE_OCR_BACKEND", "rapidocr")
    pdf = scanned_image_only_pdf()
    text, _blocks = ocr_pdf_bytes(pdf)
    cer = _character_error_rate(_REFERENCE_SNIPPET.casefold(), text.casefold())
    assert cer <= _BASELINE_CER + _MAX_CER_REGRESSION_PP
