# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from unittest.mock import patch

import numpy as np

from docuvate_worker.domain.label_automation_policy import (
    LabelAutoAssignPreset,
    LabelSuggestionPreset,
)
from docuvate_worker.infrastructure.ml.ce_ml.label_propagation import propagate_label_scores


def _mock_embed(texts: list[str]) -> list[list[float]]:
    del texts
    return [[1.0, 0.0, 0.0, 0.0]]


@patch(
    "docuvate_worker.infrastructure.ml.ce_ml.label_propagation.embed_texts_onnx",
    new=_mock_embed,
)
def test_zero_examples_never_auto_assign() -> None:
    vectors = np.eye(4, dtype=np.float32).tolist()
    scores = propagate_label_scores(vectors, label_name="Rechnung", seed_document_indices=[])
    assert scores
    assert all(row.tier != "auto_assign" for row in scores)


@patch(
    "docuvate_worker.infrastructure.ml.ce_ml.label_propagation.embed_texts_onnx",
    new=_mock_embed,
)
def test_seeded_hybrid_prefers_neighbor() -> None:
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


def _separable_pool(seed: int, per_class: int) -> tuple[list[list[float]], list[int]]:
    rng = np.random.default_rng(seed)
    centres = np.eye(2, 8) * 3.0
    labels = np.repeat(np.arange(2), per_class)
    pool = centres[labels] + rng.normal(0.0, 0.3, size=(labels.size, 8))
    unlabeled = centres[np.tile(np.arange(2), 10)] + rng.normal(0.0, 0.6, size=(20, 8))
    positives = [index for index in range(labels.size) if labels[index] == 1]
    return [*pool.tolist(), *unlabeled.tolist()], positives


def _propagate_with_presets(
    auto_assign: LabelAutoAssignPreset, suggestions: LabelSuggestionPreset
) -> list[str]:
    vectors, positives = _separable_pool(seed=11, per_class=14)
    pool_size = 28
    scores = propagate_label_scores(
        vectors,
        label_name="Rechnung",
        seed_document_indices=positives[:1],
        passage_texts=[f"doc {index}" for index in range(len(vectors))],
        positive_document_indices=positives,
        calibration_document_indices=list(range(pool_size)),
        auto_assign=auto_assign,
        suggestions=suggestions,
    )
    return [row.tier for row in scores if row.document_index >= pool_size]


def test_auto_assign_off_never_auto_assigns() -> None:
    assert "auto_assign" in _propagate_with_presets("normal", "normal")
    assert "auto_assign" not in _propagate_with_presets("off", "normal")


def test_cautious_auto_assign_is_never_broader_than_normal() -> None:
    cautious = _propagate_with_presets("cautious", "normal").count("auto_assign")
    normal = _propagate_with_presets("normal", "normal").count("auto_assign")
    assert cautious <= normal


@patch(
    "docuvate_worker.infrastructure.ml.ce_ml.label_propagation.embed_texts_onnx",
    new=_mock_embed,
)
def test_zero_shot_suggestion_preset_shifts_threshold() -> None:
    vectors = [[1.0, 0.0, 0.0, 0.0], [0.33, 0.94, 0.0, 0.0], [0.0, 1.0, 0.0, 0.0]]

    def suggested(preset: LabelSuggestionPreset) -> int:
        scores = propagate_label_scores(
            vectors, label_name="Rechnung", seed_document_indices=[], suggestions=preset
        )
        return sum(row.tier == "suggest" for row in scores)

    assert suggested("few") <= suggested("normal") <= suggested("many")
    assert suggested("few") < suggested("many")
