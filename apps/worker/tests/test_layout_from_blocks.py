import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

import pdfplumber

from docuvate_worker.domain.models import ExtractionBlock
from docuvate_worker.infrastructure.layout.from_blocks import layout_ir_from_extraction_blocks
from docuvate_worker.infrastructure.layout.render_html import layout_ir_to_html
from docuvate_worker.infrastructure.layout.render_typst import layout_ir_to_typst


def test_from_blocks_preserves_column_order() -> None:
    blocks = [
        ExtractionBlock(page=1, x=0.10, y=0.10, width=0.08, height=0.02, text="Label:", block_index=0),
        ExtractionBlock(page=1, x=0.33, y=0.098, width=0.2, height=0.02, text="Value text", block_index=1),
    ]
    doc = layout_ir_from_extraction_blocks(blocks, width_pt=595, height_pt=842)
    assert doc is not None
    runs = doc.pages[0].blocks
    assert len(runs) == 2
    assert [b.text for b in runs] == ["Label:", "Value text"]
    label = runs[0]
    value = runs[1]
    assert label.x < value.x

    html = layout_ir_to_html(doc)
    run_texts = re.findall(r'<span class="run"[^>]*>([^<]*)</span>', html)
    assert run_texts[:2] == ["Label:", "Value text"]

    typst = layout_ir_to_typst(doc)
    typst_bin = shutil.which("typst")
    if not typst_bin:
        if os.environ.get("CI"):
            raise AssertionError("typst CLI is required in CI for layout reading-order checks")
        return
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        typ_path = root / "doc.typ"
        pdf_path = root / "doc.pdf"
        typ_path.write_text(typst, encoding="utf-8")
        subprocess.run([typst_bin, "compile", str(typ_path), str(pdf_path)], check=True)
        with pdfplumber.open(pdf_path) as pdf:
            page = pdf.pages[0]
            raw = page.extract_text() or ""
        assert "Label:" in raw
        assert "Value text" in raw
        assert raw.index("Label:") < raw.index("Value text")


def test_from_blocks_truncates_pages() -> None:
    from docuvate_worker.infrastructure.layout.layout_ir_limits import MAX_LAYOUT_PAGES

    blocks = [
        ExtractionBlock(page=p, x=0.1, y=0.1, width=0.2, height=0.02, text=f"p{p}", block_index=p - 1)
        for p in range(1, MAX_LAYOUT_PAGES + 5)
    ]
    doc = layout_ir_from_extraction_blocks(blocks)
    assert doc is not None
    assert len(doc.pages) == MAX_LAYOUT_PAGES
