"""FPDF2-based PDFs with embedded TTF and Unicode scripts."""

from __future__ import annotations

import io
from collections.abc import Callable
from pathlib import Path

from fpdf import FPDF

from tests.synthetic_layout_pdfs import _BORN_DIGITAL_BANNER


def _font_path() -> Path:
    candidates = [
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"),
    ]
    for path in candidates:
        if path.is_file():
            return path
    raise FileNotFoundError("Need DejaVu or Liberation TTF for embedded-font fixtures")


def _cjk_font_path() -> Path:
    candidates = [
        Path("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"),
        Path("/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc"),
    ]
    for path in candidates:
        if path.is_file():
            return path
    raise FileNotFoundError("Need Noto Sans CJK (fonts-noto-cjk) for CJK layout fixtures")


def _fpdf_bytes(build: Callable[[FPDF, Path], None]) -> bytes:
    pdf = FPDF()
    build(pdf, _font_path())
    out = io.BytesIO()
    pdf.output(out)
    return out.getvalue()


def embedded_subset_dejavu_pdf() -> bytes:
    def build(pdf: FPDF, font_path: Path) -> None:
        pdf.add_page()
        pdf.add_font("DocuSubset", "", str(font_path))
        pdf.set_font("DocuSubset", size=11)
        pdf.multi_cell(0, 8, _BORN_DIGITAL_BANNER)
        pdf.set_font("DocuSubset", size=12)
        pdf.cell(0, 10, "Embedded DejaVu subset for layout regression", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("DocuSubset", size=10)
        pdf.cell(
            0,
            8,
            "Unknown font name in IR exercises font_map fallback.",
            new_x="LMARGIN",
            new_y="NEXT",
        )

    return _fpdf_bytes(build)


def cyrillic_body_pdf() -> bytes:
    def build(pdf: FPDF, font_path: Path) -> None:
        pdf.add_page()
        pdf.add_font("Uni", "", str(font_path))
        pdf.set_font("Uni", size=11)
        pdf.multi_cell(0, 8, _BORN_DIGITAL_BANNER)
        pdf.set_font("Uni", size=12)
        pdf.cell(0, 10, "Синтетический счёт для проверки кириллицы", new_x="LMARGIN", new_y="NEXT")

    return _fpdf_bytes(build)


def greek_body_pdf() -> bytes:
    def build(pdf: FPDF, font_path: Path) -> None:
        pdf.add_page()
        pdf.add_font("Uni", "", str(font_path))
        pdf.set_font("Uni", size=11)
        pdf.multi_cell(0, 8, _BORN_DIGITAL_BANNER)
        pdf.set_font("Uni", size=12)
        pdf.cell(0, 10, "Συνθετικό τιμολόγιο για ελληνικά", new_x="LMARGIN", new_y="NEXT")

    return _fpdf_bytes(build)


def arabic_rtl_pdf() -> bytes:
    def build(pdf: FPDF, font_path: Path) -> None:
        pdf.add_page()
        pdf.add_font("Uni", "", str(font_path))
        pdf.set_font("Uni", size=12)
        pdf.multi_cell(0, 8, _BORN_DIGITAL_BANNER)
        pdf.cell(0, 10, "فاتورة اختبار صناعية", new_x="LMARGIN", new_y="NEXT")

    return _fpdf_bytes(build)


def _times_tight_serif_scale_pdf(
    *,
    cell_width_mm: float,
    row_labels: tuple[str, ...],
    x_mm: float,
) -> bytes:
    """Times in very narrow cells so post-fix Typst keeps #scale(..., origin: left)."""

    def build(pdf: FPDF, _font_path: Path) -> None:
        pdf.add_page()
        pdf.set_font("Helvetica", size=9)
        pdf.multi_cell(0, 5, _BORN_DIGITAL_BANNER)
        pdf.set_font("Times", size=12)
        y = 28.0
        for label in row_labels:
            pdf.set_xy(x_mm, y)
            pdf.multi_cell(cell_width_mm, 5, label)
            y += 8.0

    return _fpdf_bytes(build)


def times_tight_serif_scale_left_pdf() -> bytes:
    return _times_tight_serif_scale_pdf(
        cell_width_mm=9.0,
        row_labels=(
            "ScaleOriginTight0XYZABCDEFGHIJ",
            "ScaleOriginTight1XYZABCDEFGHIJ",
            "ScaleOriginTight2XYZABCDEFGHIJ",
            "ScaleOriginTight3XYZABCDEFGHIJ",
            "ScaleOriginTight4XYZABCDEFGHIJ",
            "ScaleOriginTight5XYZABCDEFGHIJ",
        ),
        x_mm=14.0,
    )


def times_tight_serif_scale_right_pdf() -> bytes:
    return _times_tight_serif_scale_pdf(
        cell_width_mm=8.5,
        row_labels=(
            "SerifScaleRightColAABCDEFGHIJ",
            "SerifScaleRightColBABCDEFGHIJ",
            "SerifScaleRightColCABCDEFGHIJ",
            "SerifScaleRightColDABCDEFGHIJ",
            "SerifScaleRightColEABCDEFGHIJ",
            "SerifScaleRightColFABCDEFGHIJ",
        ),
        x_mm=105.0,
    )


SYNTHETIC_ACADEMIC_PAPER_TITLE = "Synthetic Academic Layout Regression Paper"


def academic_layout_regression_paper_pdf() -> bytes:
    """Multi-page born-digital paper with math fragments and a symbol table (screenshot fixture)."""

    def build(pdf: FPDF, font_path: Path) -> None:
        pdf.add_font("Body", "", str(font_path))
        pdf.set_auto_page_break(auto=True, margin=14)
        for page_index in range(18):
            pdf.add_page()
            pdf.set_font("Body", size=9)
            pdf.multi_cell(0, 4, _BORN_DIGITAL_BANNER)
            pdf.set_x(pdf.l_margin)
            if page_index == 0:
                pdf.set_font("Body", size=15)
                pdf.multi_cell(0, 7, SYNTHETIC_ACADEMIC_PAPER_TITLE)
                pdf.set_x(pdf.l_margin)
                pdf.set_font("Body", size=11)
                pdf.multi_cell(
                    0,
                    5,
                    "Abstract. We study layout reconstruction with terms μ+Σ and expressions "
                    "like (1−𝑎)𝑓 on synthetic data only.",
                )
                pdf.set_x(pdf.l_margin)
                pdf.multi_cell(0, 5, "Keywords: layout, SSIM, regression, x+y, c K d")
                pdf.set_x(pdf.l_margin)
                pdf.multi_cell(
                    0,
                    5,
                    "Absender: Muster Layout GmbH, 10115 Berlin, Musterstraße 12",
                )
            elif page_index == 15:
                pdf.set_font("Body", size=12)
                pdf.cell(0, 8, "Appendix A - Symbol table", new_x="LMARGIN", new_y="NEXT")
                pdf.set_font("Body", size=10)
                _draw_symbol_table(pdf)
            else:
                pdf.set_font("Body", size=11)
                pdf.multi_cell(
                    0,
                    5,
                    f"Section {page_index + 1}. "
                    + (
                        "This page is filler prose for pagination and compare metrics. "
                        * 3
                    ),
                )
                pdf.set_x(pdf.l_margin)

    return _fpdf_bytes(build)


def _draw_symbol_table(pdf: FPDF) -> None:
    x0, y0 = 18.0, 48.0
    col_w, row_h = 42.0, 9.0
    rows = (
        ("Symbol", "Meaning", "Notes"),
        ("μ Σ c w", "weights", "cell geometry"),
        ("x; y or c; K; d", "legacy extract", "should not appear"),
        ("l (x); β; b c c", "basis", "synthetic"),
        ("g(x); k; h; λ; s", "kernel", "synthetic"),
    )
    pdf.set_line_width(0.2)
    for row_idx, row in enumerate(rows):
        for col_idx, label in enumerate(row):
            px = x0 + col_idx * col_w
            py = y0 + row_idx * row_h
            pdf.rect(px, py, col_w, row_h)
            if row_idx == 1 and col_idx == 0:
                pdf.set_xy(px + 1.5, py + 1.5)
                pdf.cell(4, 4, "μ", border=0)
                pdf.set_xy(px + 7, py + 1.5)
                pdf.cell(4, 4, "Σ", border=0)
                pdf.set_xy(px + 12, py + 1.5)
                pdf.cell(4, 4, "c", border=0)
                pdf.set_xy(px + 16, py + 1.5)
                pdf.cell(4, 4, "w", border=0)
            else:
                pdf.set_xy(px + 1.5, py + 1.5)
                pdf.cell(col_w - 2, row_h - 2, label, border=0)


def math_symbol_table_pdf() -> bytes:
    """Single-page grid used in table cell geometry regression tests."""

    def build(pdf: FPDF, font_path: Path) -> None:
        pdf.add_page()
        pdf.add_font("Body", "", str(font_path))
        pdf.set_font("Body", size=9)
        pdf.multi_cell(0, 4, _BORN_DIGITAL_BANNER)
        pdf.set_font("Body", size=11)
        pdf.cell(0, 8, "Math symbol table", new_x="LMARGIN", new_y="NEXT")
        _draw_symbol_table(pdf)

    return _fpdf_bytes(build)


def cjk_body_pdf() -> bytes:
    def build(pdf: FPDF, _font_path: Path) -> None:
        cjk_font = _cjk_font_path()
        pdf.add_page()
        pdf.add_font("NotoCJK", "", str(cjk_font))
        pdf.set_font("NotoCJK", size=11)
        pdf.multi_cell(0, 8, _BORN_DIGITAL_BANNER)
        pdf.set_font("NotoCJK", size=12)
        pdf.cell(0, 10, "合成請求書テスト", new_x="LMARGIN", new_y="NEXT")

    return _fpdf_bytes(build)
