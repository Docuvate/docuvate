# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from docuvate_worker.domain.models import ExtractionBlock
from docuvate_worker.infrastructure.ml.ce_ml.constants import MIN_LAYOUT_UNITS
from docuvate_worker.infrastructure.ml.docai.inference import DocaiUnit, get_docai_runtime
from docuvate_worker.infrastructure.ml.ner.doc_ner import NerWord, predict_doc_ner_spans
from docuvate_worker.infrastructure.onnx_e5_encoder import embed_texts_onnx

_ENTITY_INDEX = {"PER": 0, "ORG": 1, "LOC": 2, "DATE": 3, "MONEY": 4}


@dataclass(frozen=True)
class KeyValueItem:
    document_id: str
    key_text: str | None
    value_text: str
    value_entity: int
    position: tuple[float, float, float, float]
    link_score: float


def _page_size(blocks: list[ExtractionBlock]) -> tuple[float, float]:
    max_x = max((block.x + block.width for block in blocks), default=1.0)
    max_y = max((block.y + block.height for block in blocks), default=1.0)
    return max(max_x, 1.0), max(max_y, 1.0)


def extract_kv_items_from_blocks(
    document_id: str,
    blocks: list[ExtractionBlock],
) -> list[KeyValueItem]:
    if len(blocks) < MIN_LAYOUT_UNITS:
        return []
    width, height = _page_size(blocks)
    units = [
        DocaiUnit(
            text=block.text.strip(),
            box=(block.x, block.y, block.x + block.width, block.y + block.height),
        )
        for block in blocks
        if block.text.strip()
    ]
    runtime = get_docai_runtime()
    texts = [unit.text for unit in units]
    embed_inputs = [f"query: {text}" for text in texts]
    embeddings = np.asarray(embed_texts_onnx(embed_inputs), dtype=np.float32)
    prediction = runtime.predict_units(units, width=width, height=height, embeddings=embeddings)
    fields = prediction["fields"]
    links = prediction["links"]
    key_indices = {index for index, field in enumerate(fields) if field.field_type == "key"}
    ner_words = [
        NerWord(text=unit.text, box=unit.box)
        for unit in units
    ]
    spans = predict_doc_ner_spans(ner_words, page_width=width, page_height=height)
    ent_by_index: dict[int, int] = {}
    for span in spans:
        ent = _ENTITY_INDEX.get(span.entity_type, -1)
        for idx in range(span.start_index, span.end_index):
            ent_by_index[idx] = ent

    linked_values: dict[int, tuple[int, float]] = {}
    for link in links:
        if link.source_index in key_indices:
            linked_values[link.target_index] = (link.source_index, link.score)

    items: list[KeyValueItem] = []
    for index, unit in enumerate(units):
        ent = ent_by_index.get(index, -1)
        if index in linked_values:
            key_index, score = linked_values[index]
            items.append(
                KeyValueItem(
                    document_id=document_id,
                    key_text=units[key_index].text,
                    value_text=unit.text,
                    value_entity=ent,
                    position=unit.box,
                    link_score=score,
                )
            )
        elif index not in key_indices and ent >= 0:
            items.append(
                KeyValueItem(
                    document_id=document_id,
                    key_text=None,
                    value_text=unit.text,
                    value_entity=ent,
                    position=unit.box,
                    link_score=0.0,
                )
            )
    return items
