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
def test_seeded_label_spreading_prefers_neighbor(_mock: object) -> None:
    vectors = [
        [1.0, 0.0, 0.0, 0.0],
        [0.99, 0.01, 0.0, 0.0],
        [0.0, 1.0, 0.0, 0.0],
        [0.0, 0.0, 1.0, 0.0],
    ]
    scores = propagate_label_scores(vectors, label_name="Rechnung", seed_document_indices=[0])
    by_index = {row.document_index: row for row in scores}
    assert by_index[1].score > by_index[2].score
