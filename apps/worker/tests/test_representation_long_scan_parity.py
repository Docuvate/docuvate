# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Long scans encode all representation units (bounded batches, no unit cap)."""

from __future__ import annotations

import shutil

import pytest

from docuvate_worker.application.extract import extract_document
from docuvate_worker.domain.representation.encode import encode_units
from docuvate_worker.domain.representation.units import RepresentationUnit
from tests.public_domain_dense_scans import public_domain_dense_scan_pdf

pytestmark = pytest.mark.slow

_LEGACY_CAP = 384


def _field_snapshot(result) -> tuple[tuple[str, str, float | None], ...]:
    return tuple(
        sorted(
            (
                row.key,
                row.value,
                round(row.confidence, 4) if row.confidence is not None else None,
            )
            for row in result.field_suggestions
            if row.key.strip()
        )
    )


def test_streaming_encode_retains_every_unit(monkeypatch: pytest.MonkeyPatch) -> None:
    many_units = [
        RepresentationUnit(
            unit_index=index,
            kind="paragraph",
            text=f"Unit {index}: public domain constitutional excerpt line {index % 17}.",
            page=index // 20,
            x=0.0,
            y=0.0,
            width=100.0,
            height=12.0,
            char_start=index * 40,
            char_end=index * 40 + 30,
        )
        for index in range(500)
    ]
    monkeypatch.setattr(
        "docuvate_worker.infrastructure.fastembed_model.encoder_embed_batch_size",
        lambda: 8,
    )
    representation = encode_units(many_units)
    assert len(representation.units) == len(many_units)


@pytest.mark.skipif(shutil.which("pdftoppm") is None, reason="poppler required for pdf2image")
def test_long_public_scan_encodes_more_than_legacy_unit_cap(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DOCUVATE_ALLOW_IN_PROCESS_EXTRACT", "1")
    monkeypatch.setenv("DOCUVATE_EXTRACT_SUBPROCESS", "0")
    monkeypatch.setenv("DOCUVATE_EXTRACT_ADMISSION", "0")
    monkeypatch.setenv("DOCUVATE_OCR_BACKEND", "rapidocr")
    pdf = public_domain_dense_scan_pdf(35, dpi=200, seed=11)
    result = extract_document(pdf, "application/pdf", engine="pipeline")
    rep = result.document_representation
    assert rep is not None
    assert len(rep.units) > _LEGACY_CAP, (
        f"expected full streaming encode (> {_LEGACY_CAP} units), got {len(rep.units)}"
    )


@pytest.mark.skipif(shutil.which("pdftoppm") is None, reason="poppler required for pdf2image")
def test_long_public_scan_field_suggestions_reproducible(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DOCUVATE_ALLOW_IN_PROCESS_EXTRACT", "1")
    monkeypatch.setenv("DOCUVATE_EXTRACT_SUBPROCESS", "0")
    monkeypatch.setenv("DOCUVATE_EXTRACT_ADMISSION", "0")
    monkeypatch.setenv("DOCUVATE_OCR_BACKEND", "rapidocr")
    pdf = public_domain_dense_scan_pdf(35, dpi=200, seed=11)
    first = extract_document(pdf, "application/pdf", engine="pipeline")
    second = extract_document(pdf, "application/pdf", engine="pipeline")
    snap_a = _field_snapshot(first)
    snap_b = _field_snapshot(second)
    if snap_a != snap_b:
        diff = set(snap_a) ^ set(snap_b)
        pytest.fail(
            "field_suggestions differ between identical runs on long public scan; "
            f"diff sample: {list(diff)[:5]}"
        )
