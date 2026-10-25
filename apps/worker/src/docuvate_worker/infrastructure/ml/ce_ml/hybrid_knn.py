# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from docuvate_worker.infrastructure.ml.ce_ml.constants import VECTOR_NORM_EPSILON
from docuvate_worker.infrastructure.ml.ce_ml.tfidf_vectors import build_tfidf_matrix

FloatArray = NDArray[np.float32]

_E5_TEMPERATURE = 0.02
_TFIDF_TEMPERATURE = 0.05
_DEFAULT_KNN_K = 10


def _normalize_rows(vectors: FloatArray) -> FloatArray:
    if vectors.size == 0:
        return vectors
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms = np.where(norms < VECTOR_NORM_EPSILON, 1.0, norms)
    return np.asarray(vectors / norms, dtype=np.float32)


def _knn_positive_scores(
    similarity: FloatArray,
    pool_indices: NDArray[np.intp],
    positive_mask: FloatArray,
    *,
    k: int,
    temperature: float,
) -> FloatArray:
    n = similarity.shape[0]
    scores = np.zeros(n, dtype=np.float32)
    if pool_indices.size == 0:
        return scores
    pool_sim = similarity[:, pool_indices]
    k_eff = min(k, pool_indices.size)
    for row in range(n):
        row_sim = pool_sim[row]
        neighbor_order = np.argsort(-row_sim)[:k_eff]
        neighbor_sims = row_sim[neighbor_order]
        weights = np.exp((neighbor_sims - neighbor_sims.max()) / temperature)
        weight_sum = float(weights.sum()) or 1.0
        labels = positive_mask[pool_indices[neighbor_order]]
        scores[row] = float(np.dot(weights, labels) / weight_sum)
    return scores


def hybrid_binary_label_scores(
    passage_vectors: FloatArray,
    passage_texts: list[str],
    *,
    pool_indices: list[int],
    positive_mask: FloatArray,
    knn_k: int = _DEFAULT_KNN_K,
) -> FloatArray:
    matrix = _normalize_rows(passage_vectors)
    pool = np.asarray(pool_indices, dtype=np.intp)
    if matrix.shape[0] == 0 or pool.size == 0:
        return np.zeros(matrix.shape[0], dtype=np.float32)
    e5_sim = matrix @ matrix.T
    tfidf = build_tfidf_matrix(passage_texts)
    tfidf_sim = e5_sim if tfidf.shape[1] == 0 else tfidf @ tfidf.T
    e5_scores = _knn_positive_scores(
        e5_sim,
        pool,
        positive_mask,
        k=knn_k,
        temperature=_E5_TEMPERATURE,
    )
    tfidf_scores = _knn_positive_scores(
        tfidf_sim,
        pool,
        positive_mask,
        k=knn_k,
        temperature=_TFIDF_TEMPERATURE,
    )
    return ((e5_scores + tfidf_scores) * 0.5).astype(np.float32)


def knn_neighbor_label_mass(
    passage_vectors: FloatArray,
    passage_texts: list[str],
    tag_ids_per_document: list[list[str]],
    *,
    target_index: int,
    pool_indices: list[int],
    knn_k: int = _DEFAULT_KNN_K,
) -> dict[str, float]:
    matrix = _normalize_rows(passage_vectors)
    pool = np.asarray(pool_indices, dtype=np.intp)
    if target_index < 0 or target_index >= matrix.shape[0] or pool.size == 0:
        return {}
    e5_sim = matrix @ matrix.T
    tfidf = build_tfidf_matrix(passage_texts)
    tfidf_sim = tfidf @ tfidf.T if tfidf.shape[1] > 0 else e5_sim
    hybrid_row = 0.5 * (e5_sim[target_index] + tfidf_sim[target_index])
    k_eff = min(knn_k, pool.size)
    neighbor_order = np.argsort(-hybrid_row[pool])[:k_eff]
    neighbor_indices = pool[neighbor_order]
    neighbor_sims = hybrid_row[neighbor_indices]
    weights = np.exp((neighbor_sims - neighbor_sims.max()) / _E5_TEMPERATURE)
    weight_sum = float(weights.sum()) or 1.0
    mass: dict[str, float] = {}
    for weight, doc_index in zip(weights, neighbor_indices, strict=True):
        share = float(weight) / weight_sum
        for tag_id in tag_ids_per_document[int(doc_index)]:
            mass[tag_id] = mass.get(tag_id, 0.0) + share
    return mass
