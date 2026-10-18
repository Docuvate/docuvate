# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import json
import math
from functools import lru_cache
from pathlib import Path
from typing import TypedDict

from docuvate_worker.infrastructure.extractors.field_extraction_context import (
    passage_vector_for_text,
)
from docuvate_worker.infrastructure.fastembed_model import embed_passages, embed_query

_ARTIFACT_PATH = (
    Path(__file__).resolve().parent.parent / "artifacts" / "sender-line-e5-prototypes.v1.json"
)


class SenderLinePrototypeArtifact(TypedDict):
    version: str
    encoder_id: str
    query_prototypes: list[str]


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    if na <= 0.0 or nb <= 0.0:
        return 0.0
    return dot / (na * nb)


def _max_query_cosine(passage: list[float]) -> float:
    return max(_cosine(passage, query) for query in _query_vectors())


@lru_cache(maxsize=1)
def _query_vectors() -> tuple[list[float], ...]:
    raw = json.loads(_ARTIFACT_PATH.read_text(encoding="utf-8"))
    artifact: SenderLinePrototypeArtifact = {
        "version": str(raw["version"]),
        "encoder_id": str(raw["encoder_id"]),
        "query_prototypes": [str(item) for item in raw["query_prototypes"]],
    }
    vectors: list[list[float]] = []
    for text in artifact["query_prototypes"]:
        if text.startswith("query:"):
            vectors.append(embed_query(text.removeprefix("query:").strip()))
        else:
            vectors.append(embed_query(text))
    return tuple(vectors)


def sender_line_e5_cosine(line_text: str) -> float:
    """Max cosine between the line (passage) and sender query prototypes."""
    stripped = line_text.strip()
    if not stripped:
        return 0.0
    passage = embed_passages([stripped])[0]
    return _max_query_cosine(passage)


def sender_lines_e5_cosine(lines: list[str]) -> list[float]:
    """Batch passage embeddings for multiple lines."""
    stripped = [line.strip() for line in lines]
    scores = [0.0] * len(lines)
    missing_indices: list[int] = []
    missing_texts: list[str] = []
    for index, line in enumerate(stripped):
        if not line:
            continue
        cached = passage_vector_for_text(line)
        if cached is not None:
            scores[index] = _max_query_cosine(cached)
        else:
            missing_indices.append(index)
            missing_texts.append(line)
    if missing_texts:
        vectors = embed_passages(missing_texts)
        for index, passage in zip(missing_indices, vectors, strict=True):
            scores[index] = _max_query_cosine(passage)
    return scores
