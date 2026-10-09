"""Catalog of synthetic layout SSIM regression fixtures (category + factory)."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

from docuvate_worker.infrastructure.layout.layout_reconstruction_eval import (
    CATEGORY_SSIM_FLOOR,
)
from tests.synthetic_layout_pdfs import (
    delivery_note_multipage_pdf,
    delivery_note_table_pdf,
    form_disclosure_acroform_pdf,
    form_disclosure_pdf,
    german_umlaut_body_pdf,
    landscape_table_pdf,
    layout_regression_payroll_pdf,
    mixed_page_sizes_pdf,
    mixed_standard_fonts_pdf,
    rotated_heading_pdf,
    rotated_mediabox_pdf,
    scanned_page_with_ocr_text_layer_pdf,
    symbol_and_helvetica_pdf,
    three_column_words_pdf,
    two_column_words_pdf,
)


@dataclass(frozen=True)
class LayoutSsimFixture:
    fixture_id: str
    category: str
    factory: Callable[[], bytes]
    ssim_floor: float

    @property
    def category_floor(self) -> float:
        return CATEGORY_SSIM_FLOOR[self.category]


LAYOUT_SSIM_FIXTURES: tuple[LayoutSsimFixture, ...] = (
    LayoutSsimFixture(
        "delivery_note_table",
        "table_grid",
        delivery_note_table_pdf,
        CATEGORY_SSIM_FLOOR["table_grid"],
    ),
    LayoutSsimFixture(
        "layout_regression_payroll",
        "payroll_form",
        layout_regression_payroll_pdf,
        CATEGORY_SSIM_FLOOR["payroll_form"],
    ),
    LayoutSsimFixture(
        "form_disclosure",
        "born_digital_standard",
        form_disclosure_pdf,
        CATEGORY_SSIM_FLOOR["born_digital_standard"],
    ),
    LayoutSsimFixture(
        "form_disclosure_acroform",
        "form_acroform",
        form_disclosure_acroform_pdf,
        CATEGORY_SSIM_FLOOR["form_acroform"],
    ),
    LayoutSsimFixture(
        "two_column_words",
        "multi_column",
        two_column_words_pdf,
        CATEGORY_SSIM_FLOOR["multi_column"],
    ),
    LayoutSsimFixture(
        "three_column_words",
        "multi_column",
        three_column_words_pdf,
        CATEGORY_SSIM_FLOOR["multi_column"],
    ),
    LayoutSsimFixture(
        "delivery_note_multipage",
        "multi_page",
        delivery_note_multipage_pdf,
        CATEGORY_SSIM_FLOOR["multi_page"],
    ),
    LayoutSsimFixture(
        "mixed_page_sizes",
        "multi_page",
        mixed_page_sizes_pdf,
        CATEGORY_SSIM_FLOOR["multi_page"],
    ),
    LayoutSsimFixture(
        "landscape_table",
        "landscape",
        landscape_table_pdf,
        CATEGORY_SSIM_FLOOR["landscape"],
    ),
    LayoutSsimFixture(
        "rotated_mediabox",
        "rotated",
        rotated_mediabox_pdf,
        CATEGORY_SSIM_FLOOR["rotated"],
    ),
    LayoutSsimFixture(
        "rotated_heading",
        "rotated",
        rotated_heading_pdf,
        CATEGORY_SSIM_FLOOR["rotated"],
    ),
    LayoutSsimFixture(
        "mixed_standard_fonts",
        "mixed_fonts",
        mixed_standard_fonts_pdf,
        CATEGORY_SSIM_FLOOR["mixed_fonts"],
    ),
    LayoutSsimFixture(
        "symbol_and_helvetica",
        "mixed_fonts",
        symbol_and_helvetica_pdf,
        CATEGORY_SSIM_FLOOR["mixed_fonts"],
    ),
    LayoutSsimFixture(
        "german_umlaut_body",
        "non_latin",
        german_umlaut_body_pdf,
        CATEGORY_SSIM_FLOOR["non_latin"],
    ),
    LayoutSsimFixture(
        "scanned_ocr_text_layer",
        "scanned_text_layer",
        scanned_page_with_ocr_text_layer_pdf,
        CATEGORY_SSIM_FLOOR["scanned_text_layer"],
    ),
)
