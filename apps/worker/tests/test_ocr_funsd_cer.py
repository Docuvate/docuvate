# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import json
from pathlib import Path

import pytest

from docuvate_worker.infrastructure.extractors.rapidocr_engine import ocr_image_bytes

_FIXTURE_DIR = Path(__file__).resolve().parent / "fixtures" / "ocr_eval" / "funsd"
_MANIFEST = _FIXTURE_DIR / "manifest.json"
_MAX_REGRESSION_PP = 0.005


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


@pytest.mark.skipif(not _MANIFEST.is_file(), reason="FUNSD fixtures missing; run materialize script")
def test_funsd_pages_cer_within_baseline(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DOCUVATE_OCR_BACKEND", "rapidocr")
    manifest = json.loads(_MANIFEST.read_text(encoding="utf-8"))
    baseline_raw = manifest.get("baseline_mean_cer")
    if not isinstance(baseline_raw, (int, float)):
        pytest.fail("FUNSD manifest missing baseline_mean_cer; re-run materialize script")
    baseline_cer = float(baseline_raw)
    pages = manifest.get("pages")
    if not isinstance(pages, list) or not pages:
        pytest.fail("FUNSD manifest has no pages")
    total_cer = 0.0
    for entry in pages:
        if not isinstance(entry, dict):
            continue
        image_name = str(entry.get("image") or "")
        reference = str(entry.get("reference") or "")
        image_path = _FIXTURE_DIR / image_name
        if not image_path.is_file() or not reference:
            continue
        hypothesis, _blocks = ocr_image_bytes(image_path.read_bytes())
        total_cer += _character_error_rate(reference.casefold(), hypothesis.casefold())
    page_count = len(pages)
    mean_cer = total_cer / page_count
    assert mean_cer <= baseline_cer + _MAX_REGRESSION_PP
