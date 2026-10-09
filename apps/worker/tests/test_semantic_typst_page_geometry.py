"""Semantic Typst export preserves per-page PDF media box dimensions."""

from __future__ import annotations

import io

import pytest
from pypdf import PdfReader

from docuvate_worker.infrastructure.layout.extract import extract_layout_pdf_bytes
from docuvate_worker.infrastructure.layout.pixel_compare import compile_typst_to_pdf_bytes
from docuvate_worker.infrastructure.layout.render_typst_semantic import layout_ir_to_typst_semantic
from tests.synthetic_layout_pdfs import (
    landscape_table_pdf,
    mixed_page_sizes_pdf,
    multipage_portrait_landscape_table_pdf,
    rotated_mediabox_pdf,
)


def _page_size_pt(page) -> tuple[float, float]:
    box = page.mediabox
    return float(box.width), float(box.height)


@pytest.mark.parametrize(
    ("factory", "fixture_id"),
    [
        (landscape_table_pdf, "landscape_table"),
        (mixed_page_sizes_pdf, "mixed_page_sizes"),
        (multipage_portrait_landscape_table_pdf, "multipage_portrait_landscape_table"),
        (rotated_mediabox_pdf, "rotated_mediabox"),
    ],
)
def test_semantic_typst_pdf_page_sizes_match_source(
    factory,
    fixture_id: str,
) -> None:
    source_pdf = factory()
    doc = extract_layout_pdf_bytes(source_pdf)
    assert doc is not None, fixture_id
    typst = layout_ir_to_typst_semantic(doc)
    out_pdf = compile_typst_to_pdf_bytes(typst)
    compiled = PdfReader(io.BytesIO(out_pdf))
    assert len(compiled.pages) == len(doc.pages), fixture_id
    for idx, ir_page in enumerate(doc.pages):
        sw, sh = ir_page.width_pt, ir_page.height_pt
        ow, oh = _page_size_pt(compiled.pages[idx])
        assert abs(ow - sw) <= 1.0, f"{fixture_id} page {idx + 1}: width {ow} != {sw}"
        assert abs(oh - sh) <= 1.0, f"{fixture_id} page {idx + 1}: height {oh} != {sh}"
