"""Catalog of synthetic layout SSIM regression fixtures (category + factory)."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

from docuvate_worker.infrastructure.layout.layout_reconstruction_eval import (
    CATEGORY_SSIM_FLOOR,
    ReconstructionUnreliableReason,
)
from tests.synthetic_layout_fpdf import (
    arabic_rtl_pdf,
    cjk_body_pdf,
    cyrillic_body_pdf,
    embedded_subset_dejavu_pdf,
    greek_body_pdf,
    times_tight_serif_scale_left_pdf,
    times_tight_serif_scale_right_pdf,
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
    multipage_portrait_landscape_table_pdf,
    rotated_heading_pdf,
    rotated_mediabox_pdf,
    scanned_page_with_ocr_text_layer_pdf,
    symbol_and_helvetica_pdf,
    three_column_words_pdf,
    two_column_words_pdf,
)
from tests.synthetic_scan_pdfs import (
    scanned_image_only_pdf,
    scanned_rotated_90_pdf,
)


@dataclass(frozen=True)
class LayoutSsimFixture:
    fixture_id: str
    category: str
    factory: Callable[[], bytes]
    ssim_floor: float
    expects_reliable: bool = True
    expected_unreliable_reason: ReconstructionUnreliableReason | None = None


LAYOUT_SSIM_FIXTURES: tuple[LayoutSsimFixture, ...] = (
    LayoutSsimFixture("delivery_note_table", "table_grid", delivery_note_table_pdf, CATEGORY_SSIM_FLOOR["table_grid"]),
    LayoutSsimFixture("layout_regression_payroll", "payroll_form", layout_regression_payroll_pdf, CATEGORY_SSIM_FLOOR["payroll_form"]),
    LayoutSsimFixture("form_disclosure", "born_digital_standard", form_disclosure_pdf, CATEGORY_SSIM_FLOOR["born_digital_standard"]),
    LayoutSsimFixture("form_disclosure_acroform", "form_acroform", form_disclosure_acroform_pdf, CATEGORY_SSIM_FLOOR["form_acroform"]),
    LayoutSsimFixture("two_column_words", "multi_column", two_column_words_pdf, CATEGORY_SSIM_FLOOR["multi_column"]),
    LayoutSsimFixture("three_column_words", "multi_column", three_column_words_pdf, CATEGORY_SSIM_FLOOR["multi_column"]),
    LayoutSsimFixture("delivery_note_multipage", "multi_page", delivery_note_multipage_pdf, CATEGORY_SSIM_FLOOR["multi_page"]),
    LayoutSsimFixture("mixed_page_sizes", "multi_page", mixed_page_sizes_pdf, CATEGORY_SSIM_FLOOR["multi_page"]),
    LayoutSsimFixture(
        "multipage_portrait_landscape_table",
        "multi_page",
        multipage_portrait_landscape_table_pdf,
        CATEGORY_SSIM_FLOOR["multi_page"],
    ),
    LayoutSsimFixture("landscape_table", "landscape", landscape_table_pdf, CATEGORY_SSIM_FLOOR["landscape"]),
    LayoutSsimFixture("rotated_mediabox", "rotated", rotated_mediabox_pdf, CATEGORY_SSIM_FLOOR["rotated"]),
    LayoutSsimFixture("rotated_heading", "rotated", rotated_heading_pdf, CATEGORY_SSIM_FLOOR["rotated"]),
    LayoutSsimFixture("mixed_standard_fonts", "mixed_fonts", mixed_standard_fonts_pdf, CATEGORY_SSIM_FLOOR["mixed_fonts"]),
    LayoutSsimFixture("symbol_and_helvetica", "mixed_fonts", symbol_and_helvetica_pdf, CATEGORY_SSIM_FLOOR["mixed_fonts"]),
    LayoutSsimFixture(
        "times_tight_serif_scale_left",
        "mixed_fonts",
        times_tight_serif_scale_left_pdf,
        CATEGORY_SSIM_FLOOR["mixed_fonts"],
    ),
    LayoutSsimFixture(
        "times_tight_serif_scale_right",
        "mixed_fonts",
        times_tight_serif_scale_right_pdf,
        CATEGORY_SSIM_FLOOR["mixed_fonts"],
    ),
    LayoutSsimFixture("embedded_subset_dejavu", "embedded_fonts", embedded_subset_dejavu_pdf, CATEGORY_SSIM_FLOOR["embedded_fonts"]),
    LayoutSsimFixture("german_umlaut_body", "non_latin", german_umlaut_body_pdf, CATEGORY_SSIM_FLOOR["non_latin"]),
    LayoutSsimFixture("cyrillic_body", "non_latin", cyrillic_body_pdf, CATEGORY_SSIM_FLOOR["non_latin"]),
    LayoutSsimFixture("greek_body", "non_latin", greek_body_pdf, CATEGORY_SSIM_FLOOR["non_latin"]),
    LayoutSsimFixture(
        "cjk_body",
        "non_latin",
        cjk_body_pdf,
        CATEGORY_SSIM_FLOOR["non_latin"],
        expects_reliable=False,
        expected_unreliable_reason=ReconstructionUnreliableReason.UNSUPPORTED_SCRIPT,
    ),
    LayoutSsimFixture(
        "arabic_rtl",
        "non_latin",
        arabic_rtl_pdf,
        CATEGORY_SSIM_FLOOR["non_latin"],
        expects_reliable=False,
        expected_unreliable_reason=ReconstructionUnreliableReason.UNSUPPORTED_SCRIPT,
    ),
    LayoutSsimFixture(
        "scanned_invisible_ocr",
        "scanned_text_layer",
        scanned_page_with_ocr_text_layer_pdf,
        CATEGORY_SSIM_FLOOR["scanned_text_layer"],
    ),
    LayoutSsimFixture(
        "scanned_rotated_90",
        "scanned_text_layer",
        scanned_rotated_90_pdf,
        CATEGORY_SSIM_FLOOR["scanned_text_layer"],
    ),
    LayoutSsimFixture(
        "scanned_image_only",
        "scanned_text_layer",
        scanned_image_only_pdf,
        CATEGORY_SSIM_FLOOR["scanned_text_layer"],
        expects_reliable=False,
        expected_unreliable_reason=ReconstructionUnreliableReason.SCAN_WITHOUT_TEXT_LAYER,
    ),
)
