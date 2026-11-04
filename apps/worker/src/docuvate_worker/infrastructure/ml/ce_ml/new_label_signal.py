# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""'Probably a new label' signal from relative Mahalanobis distance (closed form)."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from docuvate_worker.infrastructure.ml.ce_ml.label_ranker import (
    NOVELTY_BACKGROUND_QUANTILE,
    NOVELTY_MIN_EXAMPLES_PER_LABEL,
    build_label_features,
    novelty_signal_ready,
    relative_mahalanobis_scores,
)


@dataclass(frozen=True)
class NewLabelSignal:
    document_index: int
    score: float
    show: bool


def new_label_signals(
    *,
    passage_vectors: list[list[float]],
    passage_texts: list[str],
    tag_ids_per_document: list[list[str]],
    target_document_indices: list[int],
) -> list[NewLabelSignal]:
    """Score targets against labels with enough examples; all workspace docs form the background.

    ``show`` uses a per-workspace cut: the given quantile of the scores of the workspace's own
    labelled documents. Labels with fewer than three examples are ignored, and with fewer than two
    such labels the signal stays silent.
    """
    n = len(passage_vectors)
    targets = [index for index in target_document_indices if 0 <= index < n]
    silent = [NewLabelSignal(document_index=i, score=0.0, show=False) for i in targets]
    if n == 0 or not targets:
        return silent
    counts: dict[str, int] = {}
    for tags in tag_ids_per_document:
        for tag in set(tags):
            counts[tag] = counts.get(tag, 0) + 1
    eligible = sorted(
        tag for tag, count in counts.items() if count >= NOVELTY_MIN_EXAMPLES_PER_LABEL
    )
    if not novelty_signal_ready(np.asarray([counts[tag] for tag in eligible], dtype=np.int64)):
        return silent
    class_of = {tag: position for position, tag in enumerate(eligible)}
    rows: list[int] = []
    classes: list[int] = []
    for index, tags in enumerate(tag_ids_per_document):
        for tag in sorted(set(tags)):
            if tag in class_of:
                rows.append(index)
                classes.append(class_of[tag])
    features = build_label_features(np.asarray(passage_vectors, dtype=np.float64), passage_texts)
    labelled = features[np.asarray(rows, dtype=np.int64)]
    labels = np.asarray(classes, dtype=np.int64)
    reference = relative_mahalanobis_scores(labelled, labelled, labels, features)
    cut = float(np.quantile(reference, NOVELTY_BACKGROUND_QUANTILE))
    scores = relative_mahalanobis_scores(
        features[np.asarray(targets, dtype=np.int64)], labelled, labels, features
    )
    return [
        NewLabelSignal(document_index=index, score=float(score), show=bool(score > cut))
        for index, score in zip(targets, scores, strict=True)
    ]
