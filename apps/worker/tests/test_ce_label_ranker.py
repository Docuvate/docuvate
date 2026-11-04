# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from docuvate_worker.infrastructure.ml.ce_ml.label_ranker import (
    AUTO_ACCEPT_MIN_EXAMPLES_PER_LABEL,
    LabelVotes,
    auto_accept_mask,
    build_label_features,
    learn_auto_accept_margin,
    leave_one_out_votes,
    novelty_signal_ready,
    predict_label_votes,
    relative_mahalanobis_scores,
)


def _clustered(
    per_class: int, num_classes: int, dim: int, seed: int
) -> tuple[NDArray[np.float64], NDArray[np.int64]]:
    rng = np.random.default_rng(seed)
    centres = np.eye(num_classes, dim) * 3.0
    labels = np.repeat(np.arange(num_classes), per_class).astype(np.int64)
    points = centres[labels] + rng.normal(0.0, 0.3, size=(labels.size, dim))
    return points, labels


def test_features_are_unit_rows() -> None:
    vectors = np.array([[1.0, 1.0], [1.0, 1.2], [1.2, 1.0]])
    features = build_label_features(vectors, ["alpha beta", "alpha gamma", "beta gamma"])
    assert np.allclose(np.linalg.norm(features, axis=1), 1.0)


def test_votes_recover_separable_classes() -> None:
    points, labels = _clustered(6, 3, 5, seed=0)
    votes = predict_label_votes(points, points, labels, 3)
    assert np.array_equal(votes.ridge, labels)
    assert bool(votes.agree.all())


def test_leave_one_out_ridge_matches_refit() -> None:
    points, labels = _clustered(4, 3, 5, seed=1)
    loo = leave_one_out_votes(points, labels, 3)
    keep = np.arange(labels.size) != 0
    refit = predict_label_votes(points[:1], points[keep], labels[keep], 3)
    assert np.allclose(loo.ridge_scores[0], refit.ridge_scores[0], atol=1e-8)


def test_auto_accept_margin_needs_enough_evidence() -> None:
    points, labels = _clustered(3, 2, 4, seed=2)
    loo = leave_one_out_votes(points, labels, 2)
    assert learn_auto_accept_margin(loo, labels) is None


def test_auto_accept_margin_rejects_noisy_workspace() -> None:
    predicted = np.zeros(20, dtype=np.int64)
    votes = LabelVotes(
        ridge_scores=np.zeros((20, 2)),
        ridge=predicted,
        ridge_margin=np.linspace(1.0, 0.1, 20),
        hopfield=predicted,
        hopfield_mass=np.ones(20),
        knn=predicted,
    )
    assert learn_auto_accept_margin(votes, np.array([0, 1] * 10, dtype=np.int64)) is None


def test_auto_accept_requires_examples_per_label() -> None:
    points, labels = _clustered(12, 2, 4, seed=3)
    votes = predict_label_votes(points, points, labels, 2)
    few = np.array([AUTO_ACCEPT_MIN_EXAMPLES_PER_LABEL - 1] * 2, dtype=np.int64)
    many = np.array([AUTO_ACCEPT_MIN_EXAMPLES_PER_LABEL] * 2, dtype=np.int64)
    assert not auto_accept_mask(votes, margin_threshold=0.0, examples_per_class=few).any()
    assert auto_accept_mask(votes, margin_threshold=0.0, examples_per_class=many).all()
    assert not auto_accept_mask(votes, margin_threshold=None, examples_per_class=many).any()


def test_relative_mahalanobis_ranks_unseen_cluster_higher() -> None:
    points, labels = _clustered(8, 3, 6, seed=4)
    known = labels < 2
    scores = relative_mahalanobis_scores(points, points[known], labels[known], points)
    assert scores[~known].mean() > scores[known].mean()


def test_novelty_signal_needs_three_examples_on_two_labels() -> None:
    assert not novelty_signal_ready(np.array([1, 1, 1], dtype=np.int64))
    assert not novelty_signal_ready(np.array([3, 2], dtype=np.int64))
    assert novelty_signal_ready(np.array([3, 3], dtype=np.int64))
