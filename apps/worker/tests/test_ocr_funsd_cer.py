# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import pytest

from docuvate_worker.infrastructure.extractors.rapidocr_engine import ocr_image_bytes
from tests.funsd_ocr_cache import committed_baseline_mean_cer, load_funsd_eval_pages

_MAX_REGRESSION_PP = 0.005
_SKIP_OFFLINE = (
    "FUNSD OCR eval skipped: no network and cache empty. "
    "Run: python tests/scripts/materialize_funsd_fixtures.py "
    "(or set DOCUVATE_FUNSD_OCR_CACHE). CI fetches automatically."
)


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


def test_funsd_pages_cer_within_baseline(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DOCUVATE_OCR_BACKEND", "rapidocr")
    baseline_cer = committed_baseline_mean_cer()
    if baseline_cer is None:
        pytest.fail("Committed FUNSD manifest missing baseline_mean_cer")
    pages = load_funsd_eval_pages()
    if pages is None:
        pytest.skip(_SKIP_OFFLINE)
    total_cer = 0.0
    for entry in pages:
        image_path = entry["image_path"]
        reference = entry["reference"]
        with open(image_path, "rb") as handle:
            image_bytes = handle.read()
        hypothesis, _blocks = ocr_image_bytes(image_bytes)
        total_cer += _character_error_rate(reference.casefold(), hypothesis.casefold())
    page_count = len(pages)
    mean_cer = total_cer / page_count
    assert mean_cer <= baseline_cer + _MAX_REGRESSION_PP
