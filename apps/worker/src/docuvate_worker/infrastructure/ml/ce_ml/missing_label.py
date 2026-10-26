# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from docuvate_worker.infrastructure.ml.ce_ml.calibration import missing_label_threshold
from docuvate_worker.infrastructure.ml.ce_ml.hybrid_knn import knn_neighbor_label_mass

FloatArray = NDArray[np.float32]

_MIN_NEIGHBOR_POOL = 2


@dataclass(frozen=True)
class MissingLabelHint:
    score: float
    show: bool


def unexplained_neighbor_label_mass_share(
    *,
    passage_vectors: FloatArray,
    passage_texts: list[str],
    tag_ids_per_document: list[list[str]],
    target_index: int,
    assigned_tag_ids: list[str],
    pool_indices: list[int],
) -> float:
    mass = knn_neighbor_label_mass(
        passage_vectors,
        passage_texts,
        tag_ids_per_document,
        target_index=target_index,
        pool_indices=pool_indices,
    )
    if not mass:
        return 0.0
    total = sum(mass.values())
    if total <= 0:
        return 0.0
    assigned = {tag_id for tag_id in assigned_tag_ids}
    covered = sum(value for tag_id, value in mass.items() if tag_id in assigned)
    return float((total - covered) / total)


def missing_label_hint_score(
    *,
    passage_vectors: list[list[float]],
    passage_texts: list[str],
    tag_ids_per_document: list[list[str]],
    target_document_index: int,
    assigned_tag_ids: list[str],
    labeled_document_indices: list[int],
) -> MissingLabelHint:
    threshold = missing_label_threshold()
    matrix = np.asarray(passage_vectors, dtype=np.float32)
    return _missing_label_hint_from_matrix(
        matrix=matrix,
        passage_texts=passage_texts,
        tag_ids_per_document=tag_ids_per_document,
        target_document_index=target_document_index,
        assigned_tag_ids=assigned_tag_ids,
        labeled_document_indices=labeled_document_indices,
        threshold=threshold,
    )


def _missing_label_hint_from_matrix(
    *,
    matrix: FloatArray,
    passage_texts: list[str],
    tag_ids_per_document: list[list[str]],
    target_document_index: int,
    assigned_tag_ids: list[str],
    labeled_document_indices: list[int],
    threshold: float,
) -> MissingLabelHint:
    if (
        matrix.size == 0
        or target_document_index < 0
        or target_document_index >= matrix.shape[0]
        or not assigned_tag_ids
        or not labeled_document_indices
    ):
        return MissingLabelHint(score=0.0, show=False)
    pool = [index for index in labeled_document_indices if index != target_document_index]
    if len(pool) < _MIN_NEIGHBOR_POOL:
        return MissingLabelHint(score=0.0, show=False)
    share = unexplained_neighbor_label_mass_share(
        passage_vectors=matrix,
        passage_texts=passage_texts,
        tag_ids_per_document=tag_ids_per_document,
        target_index=target_document_index,
        assigned_tag_ids=assigned_tag_ids,
        pool_indices=pool,
    )
    return MissingLabelHint(score=share, show=share >= threshold)


@dataclass(frozen=True)
class MissingLabelBatchTarget:
    target_document_index: int
    assigned_tag_ids: list[str]


def missing_label_hint_scores_batch(
    *,
    passage_vectors: list[list[float]],
    passage_texts: list[str],
    tag_ids_per_document: list[list[str]],
    targets: list[MissingLabelBatchTarget],
    labeled_document_indices: list[int],
) -> list[MissingLabelHint]:
    threshold = missing_label_threshold()
    matrix = np.asarray(passage_vectors, dtype=np.float32)
    return [
        _missing_label_hint_from_matrix(
            matrix=matrix,
            passage_texts=passage_texts,
            tag_ids_per_document=tag_ids_per_document,
            target_document_index=target.target_document_index,
            assigned_tag_ids=target.assigned_tag_ids,
            labeled_document_indices=labeled_document_indices,
            threshold=threshold,
        )
        for target in targets
    ]
