# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from unittest.mock import MagicMock, patch

from docuvate_worker.domain.models import ExtractionBlock
from docuvate_worker.infrastructure.ml.ce_ml.docai_field_suggestions import docai_kv_field_suggestions
from docuvate_worker.infrastructure.ml.ce_ml.kv_items import KeyValueItem


@patch("docuvate_worker.infrastructure.ml.ce_ml.docai_field_suggestions.extract_kv_items_from_blocks")
def test_docai_kv_field_suggestions_abstains_below_threshold(mock_extract: MagicMock) -> None:
    mock_extract.return_value = [
        KeyValueItem(
            document_id="pipeline",
            key_text="Invoice No",
            value_text="12345",
            value_entity=0,
            position=(0.0, 0.0, 1.0, 0.1),
            link_score=0.5,
        )
    ]
    blocks = [
        ExtractionBlock(text="Invoice No", page=1, x=0, y=0, width=0.2, height=0.05),
        ExtractionBlock(text="12345", page=1, x=0.3, y=0, width=0.2, height=0.05),
    ]
    assert docai_kv_field_suggestions(blocks) == []


@patch("docuvate_worker.infrastructure.ml.ce_ml.docai_field_suggestions.extract_kv_items_from_blocks")
def test_docai_kv_field_suggestions_emits_suggestion_key(mock_extract: MagicMock) -> None:
    mock_extract.return_value = [
        KeyValueItem(
            document_id="pipeline",
            key_text="Total",
            value_text="99,00 EUR",
            value_entity=4,
            position=(0.0, 0.0, 1.0, 0.1),
            link_score=0.99,
        )
    ]
    blocks = [
        ExtractionBlock(text="Total", page=1, x=0, y=0, width=0.2, height=0.05),
        ExtractionBlock(text="99,00 EUR", page=1, x=0.3, y=0, width=0.2, height=0.05),
    ]
    rows = docai_kv_field_suggestions(blocks)
    assert len(rows) == 1
    assert rows[0].key == "suggestion:total"
    assert rows[0].value == "99,00 EUR"
