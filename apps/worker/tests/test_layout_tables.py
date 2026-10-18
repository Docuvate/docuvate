import shutil
import subprocess
import tempfile
from pathlib import Path

import pytest

from docuvate_worker.infrastructure.layout.build import build_layout_ir
from docuvate_worker.infrastructure.layout.extract import extract_layout_pdf_bytes
from docuvate_worker.infrastructure.layout.extract_scanned import pdf_likely_scanned
from docuvate_worker.infrastructure.layout.render_typst import layout_ir_to_typst
from tests.synthetic_layout_pdfs import (
    delivery_note_table_pdf,
    form_disclosure_acroform_pdf,
    form_disclosure_pdf,
    rotated_heading_pdf,
    two_column_words_pdf,
)


def test_delivery_note_table_cells_separate() -> None:
    content = delivery_note_table_pdf()
    assert not pdf_likely_scanned(content)
    doc = extract_layout_pdf_bytes(content)
    assert doc is not None
    page = doc.pages[0]
    assert len(page.blocks) >= 3
    assert len(page.tables) >= 1
    block_text = " ".join(b.text for b in page.blocks)
    assert "Item" in block_text and "Qty" in block_text
    table = page.tables[0]
    cell_texts = {cell.text for row in table.rows for cell in row}
    assert "Qty" in cell_texts


def test_form_disclosure_extracts_text() -> None:
    content = form_disclosure_pdf()
    assert not pdf_likely_scanned(content)
    doc = extract_layout_pdf_bytes(content)
    assert doc is not None
    texts = [b.text for b in doc.pages[0].blocks]
    assert any("Label" in t for t in texts)
    assert any("Value" in t for t in texts)


def test_two_column_pdf_word_spans() -> None:
    content = two_column_words_pdf()
    doc = extract_layout_pdf_bytes(content)
    assert doc is not None
    page = doc.pages[0]
    left = [b for b in page.blocks if b.x < 0.45]
    right = [b for b in page.blocks if b.x > 0.52]
    assert len(left) >= 2
    assert len(right) >= 2


def test_typst_compiles_form_fixture() -> None:
    if shutil.which("typst") is None:
        pytest.fail("typst CLI is required in CI")

    content = form_disclosure_pdf()
    doc = extract_layout_pdf_bytes(content)
    assert doc is not None
    source = layout_ir_to_typst(doc)
    with tempfile.TemporaryDirectory() as tmp:
        typ_path = Path(tmp) / "form.typ"
        pdf_path = Path(tmp) / "form.pdf"
        typ_path.write_text(source, encoding="utf-8")
        subprocess.run(
            ["typst", "compile", str(typ_path), str(pdf_path)],
            check=True,
            capture_output=True,
            text=True,
        )
        assert pdf_path.stat().st_size > 500


def test_build_layout_ir_born_digital_path() -> None:
    content = delivery_note_table_pdf()
    doc = build_layout_ir(content, "application/pdf", [])
    assert doc is not None
    assert len(doc.pages[0].tables) >= 1


def test_acroform_widgets_and_checkbox() -> None:
    content = form_disclosure_acroform_pdf()
    assert not pdf_likely_scanned(content)
    doc = extract_layout_pdf_bytes(content)
    assert doc is not None
    page = doc.pages[0]
    assert len(page.widgets) >= 2
    checkboxes = [w for w in page.widgets if w.kind.value == "checkbox"]
    assert checkboxes
    assert any(w.checked for w in checkboxes)


def test_rotated_text_extracted() -> None:
    content = rotated_heading_pdf()
    assert not pdf_likely_scanned(content)
    doc = extract_layout_pdf_bytes(content)
    assert doc is not None
    rotated = [
        b
        for b in doc.pages[0].blocks
        if b.rotation_deg is not None or b.matrix is not None
    ]
    assert len(rotated) >= 1
    assert any(b.text == "Rotated" for b in rotated)
