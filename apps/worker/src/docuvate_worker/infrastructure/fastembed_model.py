# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import logging

from docuvate_worker.domain.representation.constants import (
    ENCODER_ID,
    PASSAGE_PREFIX,
    QUERY_PREFIX,
)
from docuvate_worker.infrastructure.embedding_encoder_stats import record_passage_batch
from docuvate_worker.infrastructure.onnx_e5_encoder import embed_texts_onnx, encoder_runtime_info

logger = logging.getLogger(__name__)

MODEL_NAME = ENCODER_ID


def get_embedding_model() -> str:
    """Load ONNX weights once and return the logical model id."""
    encoder_runtime_info()
    return MODEL_NAME


def embed_passages(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    record_passage_batch(len(texts))
    prefixed = [PASSAGE_PREFIX + (t.strip() or " ") for t in texts]
    return embed_texts_onnx(prefixed)


def embed_query(text: str) -> list[float]:
    prefixed = QUERY_PREFIX + (text.strip() or " ")
    vectors = embed_texts_onnx([prefixed])
    return vectors[0] if vectors else []
