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


class _RolePrototypeArtifact(TypedDict):
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


def _load_query_vectors(relative_artifact: str) -> tuple[list[float], ...]:
    path = Path(__file__).resolve().parent.parent / "artifacts" / relative_artifact
    raw = json.loads(path.read_text(encoding="utf-8"))
    artifact: _RolePrototypeArtifact = {
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


def _max_query_cosine(passage: list[float], queries: tuple[list[float], ...]) -> float:
    if not queries:
        return 0.0
    return max(_cosine(passage, query) for query in queries)


def _lines_e5_cosine(lines: list[str], queries: tuple[list[float], ...]) -> list[float]:
    scores = [0.0] * len(lines)
    missing_indices: list[int] = []
    missing_texts: list[str] = []
    for index, line in enumerate(lines):
        stripped = line.strip()
        if not stripped:
            continue
        cached = passage_vector_for_text(stripped)
        if cached is not None:
            scores[index] = _max_query_cosine(cached, queries)
        else:
            missing_indices.append(index)
            missing_texts.append(stripped)
    if missing_texts:
        vectors = embed_passages(missing_texts)
        for index, vector in zip(missing_indices, vectors, strict=True):
            scores[index] = _max_query_cosine(vector, queries)
    return scores


@lru_cache(maxsize=1)
def _recipient_queries() -> tuple[list[float], ...]:
    return _load_query_vectors("vendor-recipient-line-e5-prototypes.v1.json")


@lru_cache(maxsize=1)
def _supplier_queries() -> tuple[list[float], ...]:
    return _load_query_vectors("vendor-supplier-line-e5-prototypes.v1.json")


@lru_cache(maxsize=1)
def _doc_heading_queries() -> tuple[list[float], ...]:
    return _load_query_vectors("vendor-doc-heading-line-e5-prototypes.v1.json")


def recipient_lines_e5_cosine(lines: list[str]) -> list[float]:
    return _lines_e5_cosine(lines, _recipient_queries())


def supplier_lines_e5_cosine(lines: list[str]) -> list[float]:
    return _lines_e5_cosine(lines, _supplier_queries())


def doc_heading_lines_e5_cosine(lines: list[str]) -> list[float]:
    return _lines_e5_cosine(lines, _doc_heading_queries())
