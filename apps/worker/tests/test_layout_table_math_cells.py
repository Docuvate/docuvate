from docuvate_worker.infrastructure.layout.extract import extract_layout_pdf_bytes
from tests.synthetic_layout_fpdf import math_symbol_table_pdf


def test_math_table_cells_use_geometry_not_semicolon_fragments() -> None:
    content = math_symbol_table_pdf()
    doc = extract_layout_pdf_bytes(content)
    assert doc is not None
    page = doc.pages[0]
    assert page.tables
    cell_texts = [cell.text for row in page.tables[0].rows for cell in row]
    mu_cells = [t for t in cell_texts if "μ" in t and "Σ" in t]
    assert mu_cells, cell_texts
    assert ";" not in mu_cells[0]
    assert "μΣ" in mu_cells[0].replace(" ", "") or "μ Σ" in mu_cells[0]
