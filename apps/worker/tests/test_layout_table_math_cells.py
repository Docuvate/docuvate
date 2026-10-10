from collections import Counter

from docuvate_worker.infrastructure.layout.extract import extract_layout_pdf_bytes
from tests.synthetic_layout_fpdf import math_symbol_table_pdf


def _non_ws_multiset(text: str) -> Counter[str]:
    return Counter(ch for ch in text if not ch.isspace())


def test_math_table_cells_use_geometry_not_semicolon_fragments() -> None:
    content = math_symbol_table_pdf()
    doc = extract_layout_pdf_bytes(content)
    assert doc is not None
    page = doc.pages[0]
    assert page.tables
    cell_texts = [cell.text for row in page.tables[0].rows for cell in row]
    mu_cells = [t for t in cell_texts if "μ" in t and "Σ" in t]
    assert mu_cells, cell_texts
    joined = mu_cells[0]
    assert ";" not in joined
    assert ", " in joined or " μ" in joined or "μ " in joined
    assert "μ, Σ" in joined or "μ Σ" in joined


def test_symbol_table_cells_preserve_char_multiset() -> None:
    content = math_symbol_table_pdf()
    doc = extract_layout_pdf_bytes(content)
    assert doc is not None
    page = doc.pages[0]
    assert page.tables
    symbol_cells = [
        cell.text
        for row in page.tables[0].rows
        for cell in row
        if any(ch in cell.text for ch in ("μ", "l", "g"))
    ]
    assert len(symbol_cells) >= 3
    g_cell = next(t for t in symbol_cells if t.startswith("g"))
    assert _non_ws_multiset(g_cell) == _non_ws_multiset("g(x); k; h; λ; s")

    l_cell = next(t for t in symbol_cells if t.startswith("l"))
    assert _non_ws_multiset(l_cell) == _non_ws_multiset("l (x); β; b c c")
