# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from unittest.mock import patch

import numpy as np

from docuvate_worker.infrastructure.ml.ce_ml.label_propagation import propagate_label_scores


def _mock_embed(texts: list[str]) -> list[list[float]]:
    del texts
    return [[1.0, 0.0, 0.0, 0.0]]


@patch(
    "docuvate_worker.infrastructure.ml.ce_ml.label_propagation.embed_texts_onnx",
    side_effect=_mock_embed,
)
def test_zero_examples_never_auto_assign(_mock: object) -> None:
    vectors = np.eye(4, dtype=np.float32).tolist()
    scores = propagate_label_scores(vectors, label_name="Rechnung", seed_document_indices=[])
    assert scores
    assert all(row.tier != "auto_assign" for row in scores)


@patch(
    "docuvate_worker.infrastructure.ml.ce_ml.label_propagation.embed_texts_onnx",
    side_effect=_mock_embed,
)
def test_seeded_hybrid_prefers_neighbor(_mock: object) -> None:
    vectors = [
        [1.0, 0.0, 0.0, 0.0],
        [0.99, 0.01, 0.0, 0.0],
        [0.0, 1.0, 0.0, 0.0],
        [0.0, 0.0, 1.0, 0.0],
    ]
    texts = [f"doc {index}" for index in range(len(vectors))]
    scores = propagate_label_scores(
        vectors,
        label_name="Rechnung",
        seed_document_indices=[0],
        passage_texts=texts,
        positive_document_indices=[0],
        calibration_document_indices=[0, 1, 2, 3],
    )
    by_index = {row.document_index: row for row in scores}
    assert by_index[1].score > by_index[2].score


def test_seeded_ridge_never_auto_assigns_below_ten_examples() -> None:
    rng = np.random.default_rng(5)
    centres = np.eye(2, 8) * 3.0
    labels = np.repeat(np.arange(2), 6)
    vectors = (centres[labels] + rng.normal(0.0, 0.2, size=(12, 8))).tolist()
    unlabeled = (centres[np.array([1, 0])] + rng.normal(0.0, 0.2, size=(2, 8))).tolist()
    positives = [index for index in range(12) if labels[index] == 1]
    scores = propagate_label_scores(
        vectors + unlabeled,
        label_name="Rechnung",
        seed_document_indices=positives[:1],
        passage_texts=[f"doc {index}" for index in range(14)],
        positive_document_indices=positives,
        calibration_document_indices=list(range(12)),
    )
    by_index = {row.document_index: row for row in scores}
    assert by_index[12].score > by_index[13].score
    assert all(row.tier != "auto_assign" for row in scores)
