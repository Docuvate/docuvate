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
def test_insufficient_calibration_abstains(_mock: object) -> None:
    vectors = np.eye(3, dtype=np.float32).tolist()
    texts = ["a", "b", "c"]
    scores = propagate_label_scores(
        vectors,
        label_name="Rechnung",
        seed_document_indices=[0],
        passage_texts=texts,
        positive_document_indices=[0],
        calibration_document_indices=[0],
    )
    assert scores
    assert all(row.tier == "none" for row in scores)


@patch(
    "docuvate_worker.infrastructure.ml.ce_ml.label_propagation.embed_texts_onnx",
    side_effect=_mock_embed,
)
def test_hybrid_propagation_can_suggest_neighbor(_mock: object) -> None:
    vectors = [
        [1.0, 0.0, 0.0, 0.0],
        [0.99, 0.01, 0.0, 0.0],
        [0.0, 1.0, 0.0, 0.0],
        [0.0, 0.0, 1.0, 0.0],
        [0.0, 0.0, 0.0, 1.0],
        [0.0, 0.0, 0.0, 0.99],
        [0.0, 0.0, 0.0, 0.98],
        [0.0, 0.0, 0.0, 0.97],
    ]
    texts = [f"invoice doc {index}" for index in range(len(vectors))]
    calibration = list(range(8))
    scores = propagate_label_scores(
        vectors,
        label_name="Rechnung",
        seed_document_indices=[0],
        passage_texts=texts,
        positive_document_indices=[0, 1],
        calibration_document_indices=calibration,
    )
    by_index = {row.document_index: row for row in scores}
    assert by_index[1].score >= by_index[2].score
