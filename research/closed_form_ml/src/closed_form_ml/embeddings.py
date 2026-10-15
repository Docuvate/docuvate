# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import os
import sys
from functools import lru_cache
from pathlib import Path

import numpy as np
from numpy.typing import NDArray

WORKER_SRC = Path(__file__).resolve().parents[4] / "apps" / "worker" / "src"


def _ensure_worker_path() -> None:
    path = str(WORKER_SRC)
    if path not in sys.path:
        sys.path.insert(0, path)


@lru_cache(maxsize=1)
def _embed_fn():
    _ensure_worker_path()
    from docuvate_worker.infrastructure.fastembed_model import (  # noqa: PLC0415
        embed_passages,
        embed_query,
    )

    return embed_passages, embed_query


def embed_passages(texts: list[str], *, batch_size: int = 32) -> NDArray[np.float64]:
    embed_p, _ = _embed_fn()
    vectors: list[list[float]] = []
    for start in range(0, len(texts), batch_size):
        chunk = texts[start : start + batch_size]
        vectors.extend(embed_p(chunk))
    return np.asarray(vectors, dtype=np.float64)


def embed_queries(texts: list[str], *, batch_size: int = 32) -> NDArray[np.float64]:
    _, embed_q = _embed_fn()
    _ = batch_size
    vectors = [embed_q(text) for text in texts]
    return np.asarray(vectors, dtype=np.float64)


def l2_normalize(x: NDArray[np.float64]) -> NDArray[np.float64]:
    norms = np.linalg.norm(x, axis=1, keepdims=True)
    norms = np.maximum(norms, 1e-12)
    return x / norms


def disable_heavy_models() -> None:
    os.environ.setdefault("DOCUVATE_AI_PROFILE", "off")
