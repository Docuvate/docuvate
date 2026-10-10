# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import threading

from fastembed import TextEmbedding

# fastembed no longer ships e5-small; e5-large ONNX hits external-data path issues on some runtimes.
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
PASSAGE_PREFIX = ""
QUERY_PREFIX = ""

_lock = threading.Lock()
_model: TextEmbedding | None = None


def get_embedding_model() -> TextEmbedding:
    global _model  # noqa: PLW0603
    if _model is not None:
        return _model
    with _lock:
        if _model is None:
            _model = TextEmbedding(model_name=MODEL_NAME)
        return _model


def embed_passages(texts: list[str]) -> list[list[float]]:
    model = get_embedding_model()
    prefixed = [PASSAGE_PREFIX + (t.strip() or " ") for t in texts]
    vectors: list[list[float]] = []
    for batch in model.embed(prefixed):
        vectors.append([float(x) for x in batch])
    return vectors


def embed_query(text: str) -> list[float]:
    model = get_embedding_model()
    prefixed = QUERY_PREFIX + (text.strip() or " ")
    for batch in model.embed([prefixed]):
        return [float(x) for x in batch]
    return []
