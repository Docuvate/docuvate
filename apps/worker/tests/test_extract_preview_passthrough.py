# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from docuvate_worker.application.extract import extract_document
from docuvate_worker.domain.models import ExtractedField, ExtractionBlock, ExtractionResult


def test_preview_pdf_survives_markdown_and_layout_wrappers() -> None:
    preview = b"%PDF-1.4 preview-bytes"
    blocks = [
        ExtractionBlock(
            page=1,
            x=0.1,
            y=0.1,
            width=0.2,
            height=0.02,
            text="Hello",
            block_index=0,
        ),
    ]
    base = ExtractionResult(
        text="Hello",
        fields=[ExtractedField(key="k", value="v")],
        blocks=blocks,
        preview_pdf=preview,
    )

    with patch("docuvate_worker.application.extract._registry.resolve") as resolve:
        resolve.return_value.extract.return_value = base
        with patch("docuvate_worker.application.extract.build_layout_ir", return_value=None):
            out = extract_document(
                b"office-content",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )

    assert out.preview_pdf == preview
    assert out.text == "Hello"


def test_preview_pdf_survives_layout_ir_wrapper() -> None:
    preview = b"%PDF-1.4 preview-bytes"
    blocks = [
        ExtractionBlock(
            page=1,
            x=0.1,
            y=0.1,
            width=0.2,
            height=0.02,
            text="Hello",
            block_index=0,
        ),
    ]
    base = ExtractionResult(
        text="Hello",
        fields=[ExtractedField(key="k", value="v")],
        blocks=blocks,
        markdown="# Hello",
        preview_pdf=preview,
    )
    layout_doc = MagicMock()
    layout_doc.to_json.return_value = {"schema": "layout-ir", "pages": []}
    fidelity = SimpleNamespace(reconstruction_reliable=True, unreliable_reason=None)

    with (
        patch("docuvate_worker.application.extract._registry.resolve") as resolve,
        patch(
            "docuvate_worker.application.extract.build_layout_ir",
            return_value=layout_doc,
        ),
        patch(
            "docuvate_worker.infrastructure.layout.layout_ir_parse.document_from_dict",
            return_value=MagicMock(),
        ),
        patch(
            "docuvate_worker.infrastructure.layout.layout_reconstruction_assess.assess_layout_reconstruction",
            return_value=fidelity,
        ),
    ):
        resolve.return_value.extract.return_value = base
        out = extract_document(b"%PDF-1.4", "application/pdf")

    assert out.preview_pdf == preview
    assert out.layout_ir == {"schema": "layout-ir", "pages": []}
