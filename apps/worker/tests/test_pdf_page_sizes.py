from tests.synthetic_layout_pdfs import mixed_page_sizes_pdf, rotated_mediabox_pdf
from docuvate_worker.infrastructure.layout.pdf_page_size import (
    image_size_pt_from_pixels,
    pdf_page_sizes_pt,
)


def test_pdf_page_sizes_mixed_portrait_landscape() -> None:
    content = mixed_page_sizes_pdf()
    sizes = pdf_page_sizes_pt(content)
    assert len(sizes) >= 2
    p1 = sizes[1]
    p2 = sizes[2]
    assert p1[0] < p1[1]
    assert p2[0] > p2[1]


def test_pdf_page_sizes_rotated_mediabox() -> None:
    sizes = pdf_page_sizes_pt(rotated_mediabox_pdf())
    assert sizes[1] == (842.0, 595.0)


def test_image_size_pt_from_pixels_with_dpi() -> None:
    assert image_size_pt_from_pixels(1000, 500, dpi_x=200, dpi_y=200) == (360.0, 180.0)


def test_image_size_pt_from_pixels_default_72_dpi() -> None:
    assert image_size_pt_from_pixels(720, 360) == (720.0, 360.0)
