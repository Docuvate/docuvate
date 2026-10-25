# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import logging
import os

from docuvate_worker.domain.representation.constants import (
    ENCODER_ID,
    PASSAGE_PREFIX,
    QUERY_PREFIX,
)
from docuvate_worker.infrastructure.embedding_encoder_stats import record_passage_batch
from docuvate_worker.infrastructure.onnx_e5_encoder import embed_texts_onnx, encoder_runtime_info

logger = logging.getLogger(__name__)

MODEL_NAME = ENCODER_ID
_DEFAULT_EMBED_BATCH = 12


def encoder_embed_batch_size() -> int:
    raw = os.environ.get("DOCUVATE_ENCODER_EMBED_BATCH", str(_DEFAULT_EMBED_BATCH)).strip()
    if not raw.isdigit():
        return _DEFAULT_EMBED_BATCH
    return max(1, min(int(raw), 64))


def get_embedding_model() -> str:
    """Load ONNX weights once and return the logical model id."""
    encoder_runtime_info()
    return MODEL_NAME


def embed_passages(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    record_passage_batch(len(texts))
    batch_size = encoder_embed_batch_size()
    outputs: list[list[float]] = []
    for start in range(0, len(texts), batch_size):
        chunk = texts[start : start + batch_size]
        prefixed = [PASSAGE_PREFIX + (t.strip() or " ") for t in chunk]
        outputs.extend(embed_texts_onnx(prefixed))
    return outputs


def embed_query(text: str) -> list[float]:
    prefixed = QUERY_PREFIX + (text.strip() or " ")
    vectors = embed_texts_onnx([prefixed])
    return vectors[0] if vectors else []
