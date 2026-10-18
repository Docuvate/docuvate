from fastapi.testclient import TestClient

from docuvate_worker.domain.layout_ir import layout_ir_document_to_json
from docuvate_worker.domain.models import ExtractionBlock
from docuvate_worker.infrastructure.layout.build import build_layout_ir
from docuvate_worker.infrastructure.layout.extract_scanned import pdf_likely_scanned
from docuvate_worker.infrastructure.layout.from_blocks import layout_ir_from_extraction_blocks
from docuvate_worker.infrastructure.layout.layout_ir_limits import MAX_LAYOUT_PAGES
from docuvate_worker.main import app
import io

from pypdf import PdfReader, PdfWriter

from docuvate_worker.infrastructure.layout.extract import extract_layout_pdf_bytes
from tests.synthetic_layout_pdfs import delivery_note_table_pdf

client = TestClient(app)
SECRET = "worker-shared-secret"


def _headers() -> dict[str, str]:
    return {"X-Worker-Secret": SECRET, "Content-Type": "application/json"}


def test_ocr_path_truncated_ir_renders() -> None:
    blocks = [
        ExtractionBlock(
            page=p,
            x=0.1,
            y=0.1,
            width=0.2,
            height=0.02,
            text=f"page {p}",
            block_index=p - 1,
        )
        for p in range(1, MAX_LAYOUT_PAGES + 3)
    ]
    doc = layout_ir_from_extraction_blocks(blocks)
    assert doc is not None
    wire = layout_ir_document_to_json(doc)
    response = client.post("/v1/layout/render-html", headers=_headers(), json={"layoutIr": wire})
    assert response.status_code == 200


def test_pdf_extract_truncates_pages() -> None:
    reader = PdfReader(io.BytesIO(delivery_note_table_pdf()))
    writer = PdfWriter()
    for _ in range(MAX_LAYOUT_PAGES + 5):
        writer.add_page(reader.pages[0])
    buf = io.BytesIO()
    writer.write(buf)
    doc = extract_layout_pdf_bytes(buf.getvalue())
    assert doc is not None
    assert len(doc.pages) <= MAX_LAYOUT_PAGES
    wire = layout_ir_document_to_json(doc)
    response = client.post("/v1/layout/render-html", headers=_headers(), json={"layoutIr": wire})
    assert response.status_code == 200


def test_born_digital_delivery_note_not_scanned() -> None:
    content = delivery_note_table_pdf()
    assert not pdf_likely_scanned(content)
    doc = build_layout_ir(content, "application/pdf", [])
    assert doc is not None
    page = doc.pages[0]
    assert len(page.tables) >= 1
    block_text = " ".join(b.text for b in page.blocks)
    assert "Item" in block_text and "Qty" in block_text
    assert len(page.tables) >= 1
