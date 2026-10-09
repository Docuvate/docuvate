"""SSIM regression: synthetic PDFs vs exact Typst reconstruction."""

from __future__ import annotations

import shutil
import subprocess

import pytest

from docuvate_worker.infrastructure.layout.extract import extract_layout_pdf_bytes
from docuvate_worker.infrastructure.layout.pixel_compare import (
    DEFAULT_COMPARE_DPI,
    compare_original_pdf_to_typst,
)
from docuvate_worker.infrastructure.layout.render_typst import layout_ir_to_typst
from tests.synthetic_layout_pdfs import (
    delivery_note_table_pdf,
    form_disclosure_acroform_pdf,
    form_disclosure_pdf,
    layout_regression_payroll_pdf,
    two_column_words_pdf,
)

# Minimum SSIM per fixture at 100 dpi (exact Typst reconstruction).
_SSIM_MIN: dict[str, float] = {
    "delivery_note_table": 0.97,
    "form_disclosure": 0.97,
    "form_disclosure_acroform": 0.96,
    "two_column_words": 0.97,
    "layout_regression_payroll": 0.97,
}


def _require_pixel_compare_tools() -> None:
    if shutil.which("typst") is None:
        pytest.fail("typst CLI is required in CI")
    try:
        subprocess.run(
            ["pdftoppm", "-v"],
            check=True,
            capture_output=True,
            text=True,
        )
    except (FileNotFoundError, subprocess.CalledProcessError):
        pytest.fail("poppler-utils (pdftoppm) is required for layout pixel-compare tests")


@pytest.mark.parametrize(
    ("fixture_name", "pdf_factory", "min_ssim"),
    [
        ("delivery_note_table", delivery_note_table_pdf, _SSIM_MIN["delivery_note_table"]),
        ("form_disclosure", form_disclosure_pdf, _SSIM_MIN["form_disclosure"]),
        (
            "form_disclosure_acroform",
            form_disclosure_acroform_pdf,
            _SSIM_MIN["form_disclosure_acroform"],
        ),
        ("two_column_words", two_column_words_pdf, _SSIM_MIN["two_column_words"]),
        (
            "layout_regression_payroll",
            layout_regression_payroll_pdf,
            _SSIM_MIN["layout_regression_payroll"],
        ),
    ],
)
def test_exact_typst_reconstruction_ssim(
    fixture_name: str,
    pdf_factory,
    min_ssim: float,
) -> None:
    _require_pixel_compare_tools()
    original = pdf_factory()
    doc = extract_layout_pdf_bytes(original)
    assert doc is not None
    typst = layout_ir_to_typst(doc)
    result = compare_original_pdf_to_typst(
        original,
        typst,
        page_number=1,
        dpi=DEFAULT_COMPARE_DPI,
    )
    assert result.ssim >= min_ssim, (
        f"{fixture_name}: SSIM {result.ssim:.4f} below floor {min_ssim} "
        f"(ink deviation {result.ink_deviation:.1%})"
    )
