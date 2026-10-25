# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from docuvate_worker.infrastructure.ml.ce_ml.calibration import label_tiers
from docuvate_worker.infrastructure.ml.ce_ml.constants import VECTOR_NORM_EPSILON
from docuvate_worker.infrastructure.onnx_e5_encoder import embed_texts_onnx

_ALPHA = 0.9
_KNN_K = 10


@dataclass(frozen=True)
class LabelPropagationDocumentScore:
    document_index: int
    score: float
    tier: str


def _normalize_rows(vectors: np.ndarray) -> np.ndarray:
    if vectors.size == 0:
        return vectors
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms = np.where(norms < VECTOR_NORM_EPSILON, 1.0, norms)
    return vectors / norms


def _knn_normalized_affinity(vectors: np.ndarray, k: int) -> np.ndarray:
    n = vectors.shape[0]
    if n == 0:
        return np.zeros((0, 0), dtype=np.float32)
    sim = vectors @ vectors.T
    np.fill_diagonal(sim, -1.0)
    k_eff = min(k, max(n - 1, 1))
    idx = np.argsort(-sim, axis=1)[:, :k_eff]
    weights = np.zeros((n, n), dtype=np.float32)
    rows = np.repeat(np.arange(n), k_eff)
    cols = idx.ravel()
    weights[rows, cols] = np.maximum(sim[rows, cols], 0.0)
    weights = np.maximum(weights, weights.T)
    degree = weights.sum(axis=1) + 1e-9
    return weights / np.sqrt(degree[:, None] * degree[None, :])


def _label_spreading(affinity: np.ndarray, seed_mask: np.ndarray) -> np.ndarray:
    n = affinity.shape[0]
    if n == 0:
        return np.zeros(0, dtype=np.float32)
    y = seed_mask.astype(np.float32)
    system = np.eye(n, dtype=np.float64) - _ALPHA * affinity.astype(np.float64)
    propagated = np.linalg.solve(system, y)
    return propagated.astype(np.float32)


def zero_shot_scores(label_name: str, passage_vectors: np.ndarray) -> np.ndarray:
    if passage_vectors.size == 0:
        return np.zeros(0, dtype=np.float32)
    query = embed_texts_onnx([f"query: {label_name.strip()}"])[0]
    q = query / (np.linalg.norm(query) + 1e-9)
    return (passage_vectors @ q).astype(np.float32)


def propagate_label_scores(
    passage_vectors: list[list[float]],
    *,
    label_name: str,
    seed_document_indices: list[int],
) -> list[LabelPropagationDocumentScore]:
    tiers = label_tiers(len(seed_document_indices))
    matrix = _normalize_rows(np.asarray(passage_vectors, dtype=np.float32))
    n = matrix.shape[0]
    if n == 0:
        return []

    if len(seed_document_indices) == 0:
        scores = zero_shot_scores(label_name, matrix)
    else:
        affinity = _knn_normalized_affinity(matrix, _KNN_K)
        seed = np.zeros(n, dtype=np.float32)
        for idx in seed_document_indices:
            if 0 <= idx < n:
                seed[idx] = 1.0
        lp = _label_spreading(affinity, seed)
        zs = zero_shot_scores(label_name, matrix)
        zs_norm = (zs - float(zs.mean())) / (float(zs.std()) + 1e-9)
        scores = lp + 0.1 * zs_norm

    auto_thr = tiers["autoAssignThreshold"]
    sugg_thr = tiers["suggestThreshold"]
    out: list[LabelPropagationDocumentScore] = []
    for i in range(n):
        if i in seed_document_indices:
            continue
        score = float(scores[i])
        if auto_thr is not None and score >= auto_thr:
            tier = "auto_assign"
        elif score >= sugg_thr:
            tier = "suggest"
        else:
            tier = "none"
        out.append(LabelPropagationDocumentScore(document_index=i, score=score, tier=tier))
    return out
