import shutil

import pytest

from docuvate_worker.infrastructure.layout.extract import extract_layout_pdf_bytes
from docuvate_worker.infrastructure.layout.layout_page_compare import (
    compare_layout_page,
    get_reconstruction_pdf,
)
from tests.synthetic_layout_fpdf import academic_layout_regression_paper_pdf


@pytest.mark.skipif(shutil.which("typst") is None, reason="typst CLI required")
@pytest.mark.skipif(shutil.which("pdftoppm") is None, reason="poppler required for pdf2image")
def test_multipage_academic_paper_compare_pages_1_and_16() -> None:
    pdf = academic_layout_regression_paper_pdf()
    doc = extract_layout_pdf_bytes(pdf)
    assert doc is not None
    assert len(doc.pages) >= 16

    reconstruction = get_reconstruction_pdf(pdf, doc)
    assert len(reconstruction) > 10_000

    for page_number in (1, 16):
        payload = compare_layout_page(
            pdf,
            doc,
            page_number=page_number,
            include_heatmap=False,
        )
        assert payload.error_code is None, payload.error_code
        assert payload.ssim is not None
        assert payload.original_png_base64
        assert payload.reconstruction_png_base64
