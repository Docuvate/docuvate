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
