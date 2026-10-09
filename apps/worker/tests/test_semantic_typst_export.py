"""Semantic Typst export: compile + token coverage for layout SSIM fixtures."""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

import pytest

from docuvate_worker.infrastructure.layout.extract import extract_layout_pdf_bytes
from docuvate_worker.infrastructure.layout.layout_reconstruction_assess import (
    assess_layout_reconstruction,
)
from docuvate_worker.infrastructure.layout.pixel_compare import compile_typst_to_pdf_bytes
from docuvate_worker.infrastructure.layout.render_typst_semantic import (
    collect_layout_ir_tokens,
    layout_ir_to_typst_semantic,
    semantic_export_leftover_line_count,
)
from docuvate_worker.infrastructure.layout.semantic_typst_metrics import (
    multiset_token_coverage,
    reading_order_lcs_ratio,
    tokens_from_pdf_sequence,
)
from docuvate_worker.infrastructure.layout.typst_export import layout_ir_to_typst_for_mode
from docuvate_worker.infrastructure.layout.typst_export_mode import TypstExportMode
from tests.layout_ssim_catalog import LAYOUT_SSIM_FIXTURES, LayoutSsimFixture

_SAMPLE_OUT = Path(__file__).resolve().parent / "fixtures" / "sample_semantic_payroll.typ"
_COVERAGE_FLOOR = 0.99
_ORDER_FLOOR_BY_CATEGORY: dict[str, float] = {
    "multi_column": 0.95,
    "scanned_text_layer": 0.55,
    "embedded_fonts": 0.75,
    "multi_page": 0.80,
}
_DEFAULT_ORDER_FLOOR = 0.82


def _order_floor(fixture: LayoutSsimFixture) -> float:
    return _ORDER_FLOOR_BY_CATEGORY.get(fixture.category, _DEFAULT_ORDER_FLOOR)


def _require_typst() -> None:
    if shutil.which("typst") is None:
        pytest.fail("typst CLI is required in CI")


def _compile_typst(source: str) -> bytes:
    _require_typst()
    return compile_typst_to_pdf_bytes(source)


def _metrics(doc, pdf_bytes: bytes) -> tuple[float, float]:
    expected = collect_layout_ir_tokens(doc)
    actual = tokens_from_pdf_sequence(pdf_bytes)
    return (
        multiset_token_coverage(expected, actual),
        reading_order_lcs_ratio(expected, actual),
    )


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
    coverage, order = _metrics(doc, pdf_out)
    order_floor = _order_floor(fixture)
    assert coverage >= _COVERAGE_FLOOR, (
        f"{fixture.fixture_id}: multiset coverage {coverage:.3f} < {_COVERAGE_FLOOR}"
    )
    assert order >= order_floor, (
        f"{fixture.fixture_id}: reading-order LCS {order:.3f} < {order_floor}"
    )
    assert semantic_export_leftover_line_count(doc) == 0, (
        f"{fixture.fixture_id}: semantic export left lines unassigned"
    )


def test_two_column_words_reading_order_in_source() -> None:
    from tests.synthetic_layout_pdfs import two_column_words_pdf

    doc = extract_layout_pdf_bytes(two_column_words_pdf())
    assert doc is not None
    src = layout_ir_to_typst_semantic(doc)
    pos_left_a = src.index("LeftA")
    pos_left_b = src.index("LeftB")
    pos_right_a = src.index("RightA")
    pos_right_b = src.index("RightB")
    assert pos_left_a < pos_left_b < pos_right_a < pos_right_b


def test_delivery_note_table_grid_in_typst() -> None:
    from tests.synthetic_layout_pdfs import delivery_note_table_pdf

    doc = extract_layout_pdf_bytes(delivery_note_table_pdf())
    assert doc is not None
    src = layout_ir_to_typst_semantic(doc)
    assert "table.header" in src
    assert "Item" in src and "Widget A" in src
    assert "Qty" in src
    body_after_table = src.split("table.header", 1)[-1]
    assert "Widget A" in body_after_table
    assert src.index("Widget A") < src.rindex("Widget B")


@pytest.mark.parametrize(
    "fixture_id",
    ["arabic_rtl", "cjk_body"],
)
def test_semantic_export_flags_unsupported_script(fixture_id: str) -> None:
    fixture = next(f for f in LAYOUT_SSIM_FIXTURES if f.fixture_id == fixture_id)
    pdf = fixture.factory()
    doc = extract_layout_pdf_bytes(pdf)
    fidelity = assess_layout_reconstruction(doc, pdf, fixture_id=fixture_id, category=fixture.category)
    assert fidelity.reconstruction_reliable is False
    assert fidelity.unreliable_reason == fixture.expected_unreliable_reason


def test_exakt_mode_unchanged() -> None:
    from tests.synthetic_layout_pdfs import form_disclosure_pdf
    from docuvate_worker.infrastructure.layout.render_typst import layout_ir_to_typst

    doc = extract_layout_pdf_bytes(form_disclosure_pdf())
    assert doc is not None
    assert layout_ir_to_typst_for_mode(doc, TypstExportMode.EXAKT) == layout_ir_to_typst(doc)


def test_semantic_typst_report(capsys: pytest.CaptureFixture[str]) -> None:
    lines = ["Semantic Typst export report", ""]
    lines.append(
        f"{'fixture':<36} {'compile':<8} {'coverage':<10} {'order':<10} {'leftover':<8}"
    )
    for fixture in LAYOUT_SSIM_FIXTURES:
        pdf = fixture.factory()
        doc = extract_layout_pdf_bytes(pdf)
        if doc is None:
            lines.append(f"{fixture.fixture_id:<36} {'skip':<8} {'n/a':<10} {'n/a':<10} {'n/a':<8}")
            continue
        compile_ok = "ok"
        coverage_s = "n/a"
        order_s = "n/a"
        leftover_s = "n/a"
        try:
            src = layout_ir_to_typst_semantic(doc)
            out = _compile_typst(src)
            leftover_s = str(semantic_export_leftover_line_count(doc))
            if fixture.expects_reliable:
                tokens = collect_layout_ir_tokens(doc)
                if tokens:
                    cov, ord_ = _metrics(doc, out)
                    coverage_s = f"{cov:.3f}"
                    order_s = f"{ord_:.3f}"
        except (OSError, subprocess.CalledProcessError, RuntimeError):
            compile_ok = "fail"
        lines.append(
            f"{fixture.fixture_id:<36} {compile_ok:<8} {coverage_s:<10} {order_s:<10} {leftover_s:<8}"
        )
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
