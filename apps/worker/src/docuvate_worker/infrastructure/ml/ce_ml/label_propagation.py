# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from docuvate_worker.infrastructure.ml.ce_ml.calibration import (
    label_propagation_min_calibration_docs,
    label_tiers,
)
from docuvate_worker.infrastructure.ml.ce_ml.conformal_threshold import (
    sequential_precision_floor,
    split_conformal_accept_threshold,
)
from docuvate_worker.infrastructure.ml.ce_ml.constants import VECTOR_NORM_EPSILON
from docuvate_worker.infrastructure.ml.ce_ml.hybrid_knn import hybrid_binary_label_scores
from docuvate_worker.infrastructure.ml.ce_ml.label_ranker import (
    AUTO_ACCEPT_MIN_EXAMPLES_PER_LABEL,
    auto_accept_mask,
    build_label_features,
    learn_auto_accept_margin,
    leave_one_out_votes,
    predict_label_votes,
)
from docuvate_worker.infrastructure.onnx_e5_encoder import embed_texts_onnx

FloatArray = NDArray[np.float32]

_BINARY_CLASSES = 2
_POSITIVE_CLASS = 1
_RIDGE_MARGIN_SPAN = 2.0


@dataclass(frozen=True)
class LabelPropagationDocumentScore:
    document_index: int
    score: float
    tier: str


def zero_shot_scores(label_name: str, passage_vectors: FloatArray) -> FloatArray:
    if passage_vectors.size == 0:
        return np.zeros(0, dtype=np.float32)
    query = np.asarray(
        embed_texts_onnx([f"query: {label_name.strip()}"])[0],
        dtype=np.float32,
    )
    norms = np.linalg.norm(passage_vectors, axis=1)
    norms = np.where(norms < VECTOR_NORM_EPSILON, 1.0, norms)
    normalized = passage_vectors / norms[:, None]
    query_norm = query / (np.linalg.norm(query) + VECTOR_NORM_EPSILON)
    return np.asarray(normalized @ query_norm, dtype=np.float32)


def propagate_label_scores(
    passage_vectors: list[list[float]],
    *,
    label_name: str,
    seed_document_indices: list[int],
    passage_texts: list[str] | None = None,
    positive_document_indices: list[int] | None = None,
    calibration_document_indices: list[int] | None = None,
) -> list[LabelPropagationDocumentScore]:
    matrix = np.asarray(passage_vectors, dtype=np.float32)
    n = matrix.shape[0]
    if n == 0:
        return []

    texts = passage_texts if passage_texts is not None else [""] * n
    if len(texts) != n:
        msg = "passage_texts length must match passage_vectors"
        raise ValueError(msg)

    positive_indices = (
        positive_document_indices
        if positive_document_indices is not None
        else list(seed_document_indices)
    )
    positive_mask = np.zeros(n, dtype=np.float32)
    for index in positive_indices:
        if 0 <= index < n:
            positive_mask[index] = 1.0

    calibration_pool = [index for index in (calibration_document_indices or []) if 0 <= index < n]
    min_cal = label_propagation_min_calibration_docs()
    positives_in_pool = sum(1 for index in calibration_pool if positive_mask[index] > 0)
    negatives_in_pool = sum(1 for index in calibration_pool if positive_mask[index] == 0)
    can_calibrate = (
        len(seed_document_indices) > 0
        and len(calibration_pool) >= min_cal
        and positives_in_pool >= 1
        and negatives_in_pool >= 1
    )

    if len(seed_document_indices) == 0:
        zero_shot = zero_shot_scores(label_name, matrix)
        sugg_thr = label_tiers(0)["suggestThreshold"]
        out: list[LabelPropagationDocumentScore] = []
        for i in range(n):
            score = float(zero_shot[i])
            tier = "suggest" if score >= sugg_thr else "none"
            out.append(LabelPropagationDocumentScore(document_index=i, score=score, tier=tier))
        return out

    vote_pool = calibration_pool if calibration_pool else list(dict.fromkeys(positive_indices))
    seed_set = set(seed_document_indices)
    pool = np.asarray(list(dict.fromkeys(vote_pool)), dtype=np.int64)
    pool_labels = np.asarray(positive_mask[pool] > 0, dtype=np.int64)
    if int(pool_labels.min()) == int(pool_labels.max()):
        hybrid = hybrid_binary_label_scores(
            matrix, texts, pool_indices=pool.tolist(), positive_mask=positive_mask
        )
        return _abstain(n, seed_set, np.asarray(hybrid, dtype=np.float64))

    features = build_label_features(matrix.astype(np.float64), texts)
    votes = predict_label_votes(features, features[pool], pool_labels, _BINARY_CLASSES)
    scores = _positive_score(votes.ridge_scores)
    if not can_calibrate:
        return _abstain(n, seed_set, scores)

    loo = leave_one_out_votes(features[pool], pool_labels, _BINARY_CLASSES)
    cal_scores = _positive_score(loo.ridge_scores).astype(np.float32)
    cal_labels = pool_labels.astype(np.float32)
    base_tau = split_conformal_accept_threshold(cal_scores, cal_labels)
    if base_tau is None:
        return _abstain(n, seed_set, scores)
    tau = sequential_precision_floor(base_tau, cal_scores, cal_labels)

    positives = int(pool_labels.sum())
    examples_per_class = np.asarray([pool_labels.size - positives, positives], dtype=np.int64)
    margin_threshold = (
        learn_auto_accept_margin(loo, pool_labels, accepted_class=_POSITIVE_CLASS)
        if positives >= AUTO_ACCEPT_MIN_EXAMPLES_PER_LABEL
        else None
    )
    auto = auto_accept_mask(
        votes, margin_threshold=margin_threshold, examples_per_class=examples_per_class
    ) & (votes.ridge == _POSITIVE_CLASS)
    propagated: list[LabelPropagationDocumentScore] = []
    for i in range(n):
        if i in seed_set:
            continue
        score = float(scores[i])
        if bool(auto[i]) and score >= tau:
            tier = "auto_assign"
        elif score >= tau:
            tier = "suggest"
        else:
            tier = "none"
        propagated.append(LabelPropagationDocumentScore(document_index=i, score=score, tier=tier))
    return propagated


def _positive_score(ridge_scores: NDArray[np.float64]) -> NDArray[np.float64]:
    """Map the binary Ridge margin (positive minus rest, within about +-2) onto [0, 1]."""
    margin = ridge_scores[:, _POSITIVE_CLASS] - ridge_scores[:, 1 - _POSITIVE_CLASS]
    return np.asarray(np.clip((margin + _RIDGE_MARGIN_SPAN) / (2 * _RIDGE_MARGIN_SPAN), 0.0, 1.0))


def _abstain(
    n: int, seed_set: set[int], scores: NDArray[np.float64]
) -> list[LabelPropagationDocumentScore]:
    return [
        LabelPropagationDocumentScore(document_index=i, score=float(scores[i]), tier="none")
        for i in range(n)
        if i not in seed_set
    ]
