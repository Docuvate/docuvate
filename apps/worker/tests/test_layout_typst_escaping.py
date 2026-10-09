import shutil
import subprocess
import tempfile
from pathlib import Path

import pytest

from docuvate_worker.domain.layout_ir import LayoutIrBlock, LayoutIrDocument, LayoutIrPage
from docuvate_worker.infrastructure.layout.render_typst import layout_ir_to_typst

MARKUP_SAMPLE = '`= # $ @ < > / * _ [ ] " + - -- --- ~`'


def test_typst_escape_markup_chars_in_output() -> None:
    doc = LayoutIrDocument(
        version=1,
        pages=(
            LayoutIrPage(
                page=1,
                width_pt=200.0,
                height_pt=200.0,
                blocks=(
                    LayoutIrBlock(
                        page=1,
                        x=0.05,
                        y=0.05,
                        width=0.9,
                        height=0.1,
                        text=MARKUP_SAMPLE,
                    ),
                    LayoutIrBlock(
                        page=1,
                        x=0.05,
                        y=0.2,
                        width=0.9,
                        height=0.1,
                        text="=heading",
                    ),
                ),
            ),
        ),
    )
    typst = layout_ir_to_typst(doc)
    assert "\\`" in typst
    assert "\\~" in typst
    assert "\\-" in typst
    assert "\\=" in typst or "heading" in typst


def test_typst_output_compiles() -> None:
    if shutil.which("typst") is None:
        pytest.fail("typst CLI is required in CI")
    doc = LayoutIrDocument(
        version=1,
        pages=(
            LayoutIrPage(
                page=1,
                width_pt=200.0,
                height_pt=200.0,
                blocks=(
                    LayoutIrBlock(
                        page=1,
                        x=0.05,
                        y=0.05,
                        width=0.9,
                        height=0.1,
                        text=MARKUP_SAMPLE,
                    ),
                ),
            ),
        ),
    )
    source = layout_ir_to_typst(doc)
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / "layout.typ"
        out = Path(tmp) / "layout.pdf"
        src.write_text(source, encoding="utf-8")
        subprocess.run(
            ["typst", "compile", str(src), str(out)],
            check=True,
            capture_output=True,
            text=True,
        )
        assert out.is_file()
