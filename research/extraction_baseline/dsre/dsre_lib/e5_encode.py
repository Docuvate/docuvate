# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import os
import sys
from pathlib import Path

import numpy as np

REPO_ROOT = Path(__file__).resolve().parents[4]
WORKER_SRC = REPO_ROOT / "apps" / "worker" / "src"
if str(WORKER_SRC) not in sys.path:
    sys.path.insert(0, str(WORKER_SRC))

os.environ.setdefault("OMP_NUM_THREADS", "4")
os.environ.setdefault("DOCUVATE_ENCODER_INTRA_OP_THREADS", "4")

from docuvate_worker.domain.representation.constants import (  # noqa: E402
    PASSAGE_PREFIX,
    QUERY_PREFIX,
)
from docuvate_worker.infrastructure.onnx_e5_encoder import (  # noqa: E402
    _feed_batch,
    _load_artifacts,
    _normalize,
)


def _l2_rows(matrix: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    norms = np.clip(norms, 1e-12, None)
    return matrix / norms


def embed_queries(texts: list[str]) -> np.ndarray:
    session, tokenizer, _ = _load_artifacts()
    prefixed = [QUERY_PREFIX + (t.strip() or " ") for t in texts]
    encoded = [tokenizer.encode(t) for t in prefixed]
    max_len = min(max(len(e.ids) for e in encoded), 512)
    batch = len(encoded)
    input_ids = np.zeros((batch, max_len), dtype=np.int64)
    attention_mask = np.zeros((batch, max_len), dtype=np.int64)
    for row, enc in enumerate(encoded):
        ids = enc.ids[:max_len]
        attn = enc.attention_mask[:max_len]
        input_ids[row, : len(ids)] = np.asarray(ids, dtype=np.int64)
        attention_mask[row, : len(attn)] = np.asarray(attn, dtype=np.int64)
    hidden = _feed_batch(session, input_ids, attention_mask)
    mask = attention_mask.astype(np.float32)[:, :, np.newaxis]
    summed = (hidden * mask).sum(axis=1)
    counts = np.clip(mask.sum(axis=1), 1e-9, None)
    pooled = summed / counts
    return _l2_rows(pooled.astype(np.float32))


def embed_document_token_matrix(doc_text: str) -> tuple[np.ndarray, list[tuple[int, int]]]:
    """Return token hidden states [T,384] and char offsets per token."""
    session, tokenizer, _ = _load_artifacts()
    prefixed = PASSAGE_PREFIX + (doc_text.strip() or " ")
    enc = tokenizer.encode(prefixed)
    max_len = min(len(enc.ids), 512)
    input_ids = np.zeros((1, max_len), dtype=np.int64)
    attention_mask = np.zeros((1, max_len), dtype=np.int64)
    input_ids[0, :max_len] = np.asarray(enc.ids[:max_len], dtype=np.int64)
    attention_mask[0, :max_len] = np.asarray(enc.attention_mask[:max_len], dtype=np.int64)
    hidden = _feed_batch(session, input_ids, attention_mask)[0]  # [T,384]

    offsets: list[tuple[int, int]] = []
    if enc.offsets:
        for start, end in enc.offsets[:max_len]:
            # offsets include passage prefix; map back to doc_text coordinates.
            adj_start = max(0, start - len(PASSAGE_PREFIX))
            adj_end = max(0, end - len(PASSAGE_PREFIX))
            offsets.append((adj_start, adj_end))
    else:
        # Fallback: approximate equal slices (rare).
        step = max(1, len(doc_text) // max_len)
        for i in range(max_len):
            offsets.append((i * step, min(len(doc_text), (i + 1) * step)))
    return hidden.astype(np.float32), offsets


def pool_span_from_tokens(
    token_hidden: np.ndarray,
    token_offsets: list[tuple[int, int]],
    char_start: int,
    char_end: int,
) -> np.ndarray:
    indices: list[int] = []
    for idx, (ts, te) in enumerate(token_offsets):
        if te <= char_start or ts >= char_end:
            continue
        indices.append(idx)
    if not indices:
        return np.zeros((token_hidden.shape[1],), dtype=np.float32)
    vec = token_hidden[indices].mean(axis=0)
    norm = np.linalg.norm(vec)
    if norm > 1e-12:
        vec = vec / norm
    return vec.astype(np.float32)
