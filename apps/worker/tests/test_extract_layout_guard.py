from unittest.mock import patch

from docuvate_worker.application.extract import extract_document
from docuvate_worker.domain.models import ExtractionBlock, ExtractionResult, ExtractedField


def test_layout_ir_failure_does_not_fail_extraction() -> None:
    blocks = [
        ExtractionBlock(page=1, x=0.1, y=0.1, width=0.2, height=0.02, text="Hello", block_index=0),
    ]
    base = ExtractionResult(text="Hello", fields=[ExtractedField(key="k", value="v")], blocks=blocks)

    with patch(
        "docuvate_worker.application.extract._registry.resolve"
    ) as resolve:
        resolve.return_value.extract.return_value = base
        with patch(
            "docuvate_worker.application.extract.build_layout_ir",
            side_effect=RuntimeError("paddle unavailable"),
        ):
            out = extract_document(b"%PDF-1.4", "application/pdf")
    assert out.text == "Hello"
    assert out.fields[0].value == "v"
    assert out.blocks == blocks
    assert out.layout_ir is None
