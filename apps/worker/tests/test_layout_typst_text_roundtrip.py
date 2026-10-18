import re
import shutil
import string
import subprocess
import tempfile
from pathlib import Path

import pytest

from docuvate_worker.domain.layout_ir import LayoutIrBlock, LayoutIrDocument, LayoutIrPage
from docuvate_worker.infrastructure.layout.render_typst import layout_ir_to_typst

_STRING_LITERAL_RE = re.compile(r'#"(?:\\.|[^"\\])*"')


def _unescape_typst_string(raw: str) -> str:
    chars: list[str] = []
    idx = 0
    while idx < len(raw):
        if raw[idx] == "\\" and idx + 1 < len(raw):
            chars.append(raw[idx + 1])
            idx += 2
            continue
        chars.append(raw[idx])
        idx += 1
    return "".join(chars)


def _decode_typst_string_literals(typst: str) -> list[str]:
    out: list[str] = []
    for match in _STRING_LITERAL_RE.finditer(typst):
        raw = match.group(0)[2:-1]
        out.append(_unescape_typst_string(raw))
    return out


def _compile_typst(source: str) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / "roundtrip.typ"
        out = Path(tmp) / "roundtrip.pdf"
        src.write_text(source, encoding="utf-8")
        subprocess.run(
            ["typst", "compile", str(src), str(out)],
            check=True,
            capture_output=True,
            text=True,
        )


def _doc_with_text(text: str) -> LayoutIrDocument:
    return LayoutIrDocument(
        version=1,
        pages=(
            LayoutIrPage(
                page=1,
                width_pt=220.0,
                height_pt=220.0,
                blocks=(
                    LayoutIrBlock(
                        page=1,
                        x=0.05,
                        y=0.05,
                        width=0.9,
                        height=0.12,
                        text=text,
                    ),
                ),
            ),
        ),
    )


@pytest.mark.parametrize(
    "sample",
    [
        string.punctuation,
        "μ+(1−𝑎)𝑓",
        "Σcw β λ",
        "a#b$c*d_e`f<g>@h[i]j\\k=l-m+n/o~p",
        "line\nbreak",
        "quote\"backslash\\",
    ],
)
def test_typst_text_literal_roundtrip_and_compiles(sample: str) -> None:
    if shutil.which("typst") is None:
        pytest.fail("typst CLI is required in CI")
    typst = layout_ir_to_typst(_doc_with_text(sample))
    decoded = _decode_typst_string_literals(typst)
    assert sample in decoded
    _compile_typst(typst)
