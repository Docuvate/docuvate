"""Semantic Typst export: compile + token coverage for layout SSIM fixtures."""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

import pytest

from docuvate_worker.infrastructure.layout.extract import extract_layout_pdf_bytes
from docuvate_worker.infrastructure.layout.pixel_compare import compile_typst_to_pdf_bytes
from docuvate_worker.infrastructure.layout.render_typst_semantic import (
    collect_layout_ir_tokens,
    layout_ir_to_typst_semantic,
    tokens_from_pdf_text,
)
from docuvate_worker.infrastructure.layout.typst_export import layout_ir_to_typst_for_mode
from docuvate_worker.infrastructure.layout.typst_export_mode import TypstExportMode
from tests.layout_ssim_catalog import LAYOUT_SSIM_FIXTURES, LayoutSsimFixture

_SAMPLE_OUT = Path(__file__).resolve().parent / "fixtures" / "sample_semantic_payroll.typ"
_COVERAGE_FLOOR = 0.99


def _require_typst() -> None:
    if shutil.which("typst") is None:
        pytest.fail("typst CLI is required in CI")


def _compile_typst(source: str) -> bytes:
    _require_typst()
    return compile_typst_to_pdf_bytes(source)


def _token_coverage(source_tokens: list[str], pdf_bytes: bytes) -> float:
    if not source_tokens:
        return 1.0
    found = tokens_from_pdf_text(pdf_bytes)
    blob = " ".join(found)
    hit = sum(
        1
        for tok in source_tokens
        if tok in found or tok in blob or any(tok in word for word in found)
    )
    return hit / len(source_tokens)


@pytest.mark.parametrize("fixture", LAYOUT_SSIM_FIXTURES, ids=lambda f: f.fixture_id)
def test_semantic_typst_compiles_for_fixture(fixture: LayoutSsimFixture) -> None:
    pdf = fixture.factory()
    doc = extract_layout_pdf_bytes(pdf)
    if doc is None:
        if not fixture.expects_reliable:
            pytest.skip("no IR for unreliable fixture")
        pytest.fail(f"{fixture.fixture_id}: extraction returned no document")
    source = layout_ir_to_typst_semantic(doc)
    assert source.strip()
    assert "#place(" not in source
    _compile_typst(source)


@pytest.mark.parametrize("fixture", LAYOUT_SSIM_FIXTURES, ids=lambda f: f.fixture_id)
def test_semantic_typst_token_coverage(fixture: LayoutSsimFixture) -> None:
    if not fixture.expects_reliable:
        pytest.skip("token coverage only for reliable fixtures")
    pdf = fixture.factory()
    doc = extract_layout_pdf_bytes(pdf)
    assert doc is not None
    source_tokens = collect_layout_ir_tokens(doc)
    if len(source_tokens) < 3:
        pytest.skip(f"{fixture.fixture_id}: too few IR tokens")
    pdf_out = _compile_typst(layout_ir_to_typst_semantic(doc))
    coverage = _token_coverage(source_tokens, pdf_out)
    assert coverage >= _COVERAGE_FLOOR, (
        f"{fixture.fixture_id}: token coverage {coverage:.3f} < {_COVERAGE_FLOOR}"
    )


def test_exakt_mode_unchanged() -> None:
    from tests.synthetic_layout_pdfs import form_disclosure_pdf
    from docuvate_worker.infrastructure.layout.render_typst import layout_ir_to_typst

    doc = extract_layout_pdf_bytes(form_disclosure_pdf())
    assert doc is not None
    assert layout_ir_to_typst_for_mode(doc, TypstExportMode.EXAKT) == layout_ir_to_typst(doc)


def test_semantic_typst_report(capsys: pytest.CaptureFixture[str]) -> None:
    lines = ["Semantic Typst export report", ""]
    lines.append(f"{'fixture':<36} {'compile':<8} {'coverage':<10}")
    for fixture in LAYOUT_SSIM_FIXTURES:
        pdf = fixture.factory()
        doc = extract_layout_pdf_bytes(pdf)
        if doc is None:
            lines.append(f"{fixture.fixture_id:<36} {'skip':<8} {'n/a':<10}")
            continue
        compile_ok = "ok"
        coverage_s = "n/a"
        try:
            src = layout_ir_to_typst_semantic(doc)
            out = _compile_typst(src)
            if fixture.expects_reliable:
                tokens = collect_layout_ir_tokens(doc)
                if tokens:
                    coverage_s = f"{_token_coverage(tokens, out):.3f}"
        except (OSError, subprocess.CalledProcessError, RuntimeError):
            compile_ok = "fail"
        lines.append(f"{fixture.fixture_id:<36} {compile_ok:<8} {coverage_s:<10}")
    print("\n".join(lines))
    assert lines


def test_sample_semantic_payroll_fixture_matches_committed_file() -> None:
    from tests.synthetic_layout_pdfs import layout_regression_payroll_pdf

    doc = extract_layout_pdf_bytes(layout_regression_payroll_pdf())
    assert doc is not None
    sample = layout_ir_to_typst_semantic(doc)
    _compile_typst(sample)
    assert _SAMPLE_OUT.is_file(), "commit tests/fixtures/sample_semantic_payroll.typ"
    committed = _SAMPLE_OUT.read_text(encoding="utf-8")
    assert committed.strip() == sample.strip()
