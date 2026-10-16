# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Benchmark extractors wrapping GLiNER2, layout KV, and E5 span baseline."""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path
from typing import Sequence

import numpy as np

from common import (
    CORD_GLINER_ENTITY_TYPES,
    FieldPrediction,
    REPO_ROOT,
    SROIE_GLINER_ENTITY_TYPES,
    WORKER_SRC,
)

sys.path.insert(0, str(WORKER_SRC))

os.environ.setdefault("OMP_NUM_THREADS", "4")
os.environ.setdefault("DOCUVATE_ENCODER_INTRA_OP_THREADS", "4")

_gliner_model = None


def get_gliner():
    global _gliner_model  # noqa: PLW0603
    if _gliner_model is None:
        from gliner2 import GLiNER2

        cache = REPO_ROOT / "research" / "extraction_baseline" / ".cache" / "huggingface"
        _gliner_model = GLiNER2.from_pretrained("fastino/gliner2-base-v1", cache_dir=str(cache))
    return _gliner_model


def gliner_extract(text: str, entity_types: Sequence[str]) -> list[FieldPrediction]:
    model = get_gliner()
    batch = model.batch_extract_entities([text], entity_types=list(entity_types))
    row = batch[0] if batch else {}
    entities = row.get("entities") if isinstance(row, dict) else {}
    preds: list[FieldPrediction] = []
    if isinstance(entities, dict):
        for key, spans in entities.items():
            if not isinstance(spans, list):
                continue
            for span in spans:
                if isinstance(span, str) and span.strip():
                    preds.append(FieldPrediction(key=str(key), value=span.strip(), confidence=1.0))
    return preds


def layout_kv_extract(text: str, blocks: list) -> list[FieldPrediction]:
    from docuvate_worker.domain.models import ExtractionBlock
    from docuvate_worker.domain.representation.encode import encode_units
    from docuvate_worker.domain.representation.units import RepresentationUnit
    from docuvate_worker.infrastructure.ml.layout_kv_roles.suggestions import (
        layout_kv_field_suggestions,
    )

    units: list[RepresentationUnit] = []
    extraction_blocks: list[ExtractionBlock] = []
    for idx, block in enumerate(blocks):
        body = str(block.get("text", "")).strip()
        if not body:
            continue
        extraction_blocks.append(
            ExtractionBlock(
                page=int(block.get("page", 1)),
                x=float(block.get("x", 0.0)),
                y=float(block.get("y", 0.0)),
                width=float(block.get("width", 0.1)),
                height=float(block.get("height", 0.02)),
                text=body,
                block_index=idx,
            )
        )
        units.append(
            RepresentationUnit(
                unit_index=len(units),
                kind="paragraph",
                text=body,
                page=int(block.get("page", 1)),
                x=float(block.get("x", 0.0)),
                y=float(block.get("y", 0.0)),
                width=float(block.get("width", 0.1)),
                height=float(block.get("height", 0.02)),
                char_start=0,
                char_end=len(body),
            )
        )
    representation = encode_units(units) if units else None
    rows = layout_kv_field_suggestions(extraction_blocks, representation)
    return [
        FieldPrediction(key=row.key, value=row.value, confidence=row.confidence or 0.0)
        for row in rows
    ]


_word_split = re.compile(r"\S+")


def e5_span_extract(
    text: str,
    field_labels: Sequence[str],
    *,
    abstain_cosine: float = 0.45,
) -> list[FieldPrediction]:
    from docuvate_worker.domain.representation.constants import QUERY_PREFIX
    from docuvate_worker.infrastructure.onnx_e5_encoder import embed_texts_onnx

    words = _word_split.findall(text)
    if not words or not field_labels:
        return []

    spans: list[tuple[str, str]] = []
    cursor = 0
    for word in words:
        start = text.find(word, cursor)
        if start < 0:
            start = cursor
        end = start + len(word)
        cursor = end
        left = max(0, start - 24)
        right = min(len(text), end + 24)
        context = text[left:right].strip()
        spans.append((word, context))

    passage_vectors = embed_texts_onnx([f"passage: {ctx}" for _, ctx in spans])
    query_vectors = embed_texts_onnx([QUERY_PREFIX + label.replace("_", " ") for label in field_labels])

    def cosine(a: list[float], b: list[float]) -> float:
        va = np.asarray(a, dtype=np.float32)
        vb = np.asarray(b, dtype=np.float32)
        denom = float(np.linalg.norm(va) * np.linalg.norm(vb))
        if denom <= 0:
            return 0.0
        return float(np.dot(va, vb) / denom)

    used_words: set[int] = set()
    preds: list[FieldPrediction] = []
    for label_idx, label in enumerate(field_labels):
        best_score = -1.0
        best_word_idx = -1
        qv = query_vectors[label_idx]
        for word_idx, pv in enumerate(passage_vectors):
            if word_idx in used_words:
                continue
            score = cosine(qv, pv)
            if score > best_score:
                best_score = score
                best_word_idx = word_idx
        if best_word_idx < 0 or best_score < abstain_cosine:
            continue
        used_words.add(best_word_idx)
        preds.append(
            FieldPrediction(key=label, value=words[best_word_idx], confidence=float(best_score))
        )
    return preds


def entity_types_for_dataset(name: str) -> tuple[str, ...]:
    if name == "cord":
        return CORD_GLINER_ENTITY_TYPES
    if name == "sroie":
        return SROIE_GLINER_ENTITY_TYPES
    msg = f"unknown dataset {name}"
    raise ValueError(msg)
