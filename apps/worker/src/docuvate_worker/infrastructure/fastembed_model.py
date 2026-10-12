# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import logging
import os
import threading

from fastembed import TextEmbedding
from sentence_transformers import SentenceTransformer

from docuvate_worker.domain.representation.constants import (
    ENCODER_ID,
    PASSAGE_PREFIX,
    QUERY_PREFIX,
)
from docuvate_worker.infrastructure.embedding_encoder_stats import record_passage_batch

logger = logging.getLogger(__name__)

MODEL_NAME = ENCODER_ID
_E5_ONNX_CANDIDATES = (
    "intfloat/multilingual-e5-small",
    "Qdrant/multilingual-e5-small-onnx",
)

_lock = threading.Lock()
_model: object | None = None
_backend: str | None = None


def _load_sentence_transformers() -> SentenceTransformer:
    revision = os.environ.get("DOCUVATE_ENCODER_REVISION")
    kwargs: dict[str, str] = {}
    if revision:
        kwargs["revision"] = revision
    return SentenceTransformer(MODEL_NAME, device="cpu", **kwargs)


def _load_fastembed() -> TextEmbedding | None:
    for candidate in _E5_ONNX_CANDIDATES:
        try:
            return TextEmbedding(model_name=candidate)
        except Exception:
            continue
    return None


def get_embedding_model() -> object:
    global _model, _backend  # noqa: PLW0603
    if _model is not None:
        return _model
    with _lock:
        if _model is None:
            fast = _load_fastembed()
            if fast is not None:
                _model = fast
                _backend = "fastembed"
            else:
                _model = _load_sentence_transformers()
                _backend = "sentence_transformers"
                logger.info("embedding_backend=%s model=%s", _backend, MODEL_NAME)
        return _model


def _embed_with_backend(model: object, texts: list[str]) -> list[list[float]]:
    backend = _backend or "fastembed"
    if backend == "sentence_transformers":
        st_model = model
        if not isinstance(st_model, SentenceTransformer):
            msg = "invalid sentence_transformers model handle"
            raise TypeError(msg)
        matrix = st_model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        return [[float(x) for x in row] for row in matrix]
    fe_model = model
    if not isinstance(fe_model, TextEmbedding):
        msg = "invalid fastembed model handle"
        raise TypeError(msg)
    vectors: list[list[float]] = []
    for batch in fe_model.embed(texts):
        vectors.append([float(x) for x in batch])
    return vectors


def embed_passages(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    record_passage_batch(len(texts))
    model = get_embedding_model()
    prefixed = [PASSAGE_PREFIX + (t.strip() or " ") for t in texts]
    return _embed_with_backend(model, prefixed)


def embed_query(text: str) -> list[float]:
    model = get_embedding_model()
    prefixed = QUERY_PREFIX + (text.strip() or " ")
    vectors = _embed_with_backend(model, [prefixed])
    return vectors[0] if vectors else []
