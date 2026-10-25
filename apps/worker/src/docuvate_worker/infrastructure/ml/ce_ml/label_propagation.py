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
from docuvate_worker.infrastructure.onnx_e5_encoder import embed_texts_onnx

FloatArray = NDArray[np.float32]


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


def _leave_one_out_calibration(
    passage_vectors: FloatArray,
    passage_texts: list[str],
    *,
    calibration_indices: list[int],
    positive_mask: FloatArray,
) -> tuple[FloatArray, FloatArray]:
    scores: list[float] = []
    labels: list[float] = []
    for held in calibration_indices:
        pool = [index for index in calibration_indices if index != held]
        if not pool:
            continue
        row_scores = hybrid_binary_label_scores(
            passage_vectors,
            passage_texts,
            pool_indices=pool,
            positive_mask=positive_mask,
        )
        scores.append(float(row_scores[held]))
        labels.append(float(positive_mask[held]))
    return np.asarray(scores, dtype=np.float32), np.asarray(labels, dtype=np.float32)


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

    calibration_pool = [
        index for index in (calibration_document_indices or []) if 0 <= index < n
    ]
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
        scores = zero_shot_scores(label_name, matrix)
        tiers = label_tiers(0)
        auto_thr = tiers["autoAssignThreshold"]
        sugg_thr = tiers["suggestThreshold"]
        out: list[LabelPropagationDocumentScore] = []
        for i in range(n):
            score = float(scores[i])
            if auto_thr is not None and score >= auto_thr:
                tier = "auto_assign"
            elif score >= sugg_thr:
                tier = "suggest"
            else:
                tier = "none"
            out.append(LabelPropagationDocumentScore(document_index=i, score=score, tier=tier))
        return out

    vote_pool = (
        calibration_pool
        if calibration_pool
        else list(dict.fromkeys(positive_indices))
    )
    scores = hybrid_binary_label_scores(
        matrix,
        texts,
        pool_indices=vote_pool,
        positive_mask=positive_mask,
    )

    if not can_calibrate:
        abstain: list[LabelPropagationDocumentScore] = []
        for i in range(n):
            if i in seed_document_indices:
                continue
            abstain.append(
                LabelPropagationDocumentScore(
                    document_index=i,
                    score=float(scores[i]),
                    tier="none",
                )
            )
        return abstain

    cal_scores, cal_labels = _leave_one_out_calibration(
        matrix,
        texts,
        calibration_indices=calibration_pool,
        positive_mask=positive_mask,
    )
    base_tau = split_conformal_accept_threshold(cal_scores, cal_labels)
    if base_tau is None:
        abstain_none: list[LabelPropagationDocumentScore] = []
        for i in range(n):
            if i in seed_document_indices:
                continue
            abstain_none.append(
                LabelPropagationDocumentScore(
                    document_index=i,
                    score=float(scores[i]),
                    tier="none",
                )
            )
        return abstain_none

    tau = sequential_precision_floor(base_tau, cal_scores, cal_labels)
    tiers = label_tiers(len(seed_document_indices))
    auto_thr = tiers["autoAssignThreshold"]
    propagated: list[LabelPropagationDocumentScore] = []
    for i in range(n):
        if i in seed_document_indices:
            continue
        score = float(scores[i])
        if score < tau:
            tier = "none"
        elif auto_thr is not None and score >= max(tau, auto_thr):
            tier = "auto_assign"
        else:
            tier = "suggest"
        propagated.append(LabelPropagationDocumentScore(document_index=i, score=score, tier=tier))
    return propagated
