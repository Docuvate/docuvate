from docuvate_worker.domain.models import ExtractionBlock
from docuvate_worker.infrastructure.layout.from_blocks import layout_ir_from_extraction_blocks
from docuvate_worker.infrastructure.layout.render_typst import layout_ir_to_typst


def test_layout_ir_to_typst_contains_text() -> None:
    blocks = [
        ExtractionBlock(page=1, x=0.1, y=0.1, width=0.5, height=0.05, text="Lieferschein", block_index=0),
    ]
    doc = layout_ir_from_extraction_blocks(blocks)
    assert doc is not None
    typst = layout_ir_to_typst(doc)
    assert "Lieferschein" in typst
