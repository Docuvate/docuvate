from docuvate_worker.domain.layout_ir import LAYOUT_IR_VERSION, LayoutIrDocument
from docuvate_worker.domain.models import ExtractionBlock
from docuvate_worker.infrastructure.layout.anchors import anchor_layout_to_extraction_blocks
from docuvate_worker.infrastructure.layout.build import build_layout_ir
from docuvate_worker.infrastructure.layout.from_blocks import layout_ir_from_extraction_blocks
from docuvate_worker.infrastructure.layout.render_typst import layout_ir_to_typst


def test_layout_ir_from_blocks_serializes_version() -> None:
    blocks = [
        ExtractionBlock(page=1, x=0.1, y=0.1, width=0.2, height=0.02, text="Hello", block_index=0),
        ExtractionBlock(page=1, x=0.32, y=0.1, width=0.15, height=0.02, text="world", block_index=1),
    ]
    doc = layout_ir_from_extraction_blocks(blocks)
    assert doc is not None
    payload = doc.to_json()
    assert payload["version"] == LAYOUT_IR_VERSION
    assert len(payload["pages"]) == 1
    assert len(payload["pages"][0]["blocks"]) == 2
    texts = {b["text"] for b in payload["pages"][0]["blocks"]}
    assert texts == {"Hello", "world"}


def test_anchor_layout_maps_block_index() -> None:
    blocks = [
        ExtractionBlock(page=1, x=0.1, y=0.1, width=0.1, height=0.02, text="A", block_index=0),
        ExtractionBlock(page=1, x=0.25, y=0.1, width=0.1, height=0.02, text="B", block_index=1),
    ]
    raw = layout_ir_from_extraction_blocks(blocks)
    assert raw is not None
    anchored = anchor_layout_to_extraction_blocks(raw, blocks)
    page_block = anchored.pages[0].blocks[0]
    assert page_block.block_index == 0


def test_typst_renderer_includes_text() -> None:
    blocks = [
        ExtractionBlock(page=1, x=0.1, y=0.1, width=0.5, height=0.05, text="Invoice", block_index=0),
    ]
    doc = layout_ir_from_extraction_blocks(blocks)
    assert doc is not None
    typst = layout_ir_to_typst(doc)
    assert "Invoice" in typst
    assert "#page(" in typst


def test_build_layout_ir_from_fixture_pdf() -> None:
    from tests.synthetic_layout_pdfs import delivery_note_table_pdf

    content = delivery_note_table_pdf()
    blocks = [
        ExtractionBlock(page=1, x=0.1, y=0.1, width=0.2, height=0.02, text="x", block_index=0),
    ]
    doc = build_layout_ir(content, "application/pdf", blocks)
    assert doc is not None
    assert isinstance(doc, LayoutIrDocument)
