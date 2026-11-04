# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Closed-form label ranking on centred e5 plus TF-IDF-SVD document features.

Three cheap voters share one feature space:

* Ridge regression (one closed-form solve, +-1 one-vs-rest targets) ranks labels.
* A Hopfield / prototype readout (softmax attention over labelled documents).
* Similarity-weighted kNN over the three nearest labelled documents.

Auto-accept requires all three to agree plus a Ridge margin threshold that is learned per
workspace from leave-one-out predictions on its own confirmed labels. Without enough evidence
no threshold exists and nothing is auto-accepted.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from docuvate_worker.infrastructure.ml.ce_ml.constants import VECTOR_NORM_EPSILON
from docuvate_worker.infrastructure.ml.ce_ml.tfidf_vectors import build_tfidf_matrix

FloatArray = NDArray[np.float64]
IntArray = NDArray[np.int64]
BoolArray = NDArray[np.bool_]

SVD_DIMENSIONS = 128
RIDGE_LAMBDA = 1.0
HOPFIELD_BETA = 16.0
KNN_NEIGHBORS = 3
AUTO_ACCEPT_MIN_EXAMPLES_PER_LABEL = 10
AUTO_ACCEPT_PRECISION_TARGET = 0.98
NOVELTY_MIN_EXAMPLES_PER_LABEL = 3
NOVELTY_MIN_LABELS = 2
NOVELTY_BACKGROUND_QUANTILE = 0.95
_COVARIANCE_SHRINKAGE = 0.5
_COVARIANCE_JITTER = 1e-6
_MIN_CLASSES_FOR_MARGIN = 2


def normalize_rows(matrix: FloatArray) -> FloatArray:
    if matrix.size == 0:
        return matrix
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    return np.asarray(matrix / (norms + VECTOR_NORM_EPSILON), dtype=np.float64)


def _tfidf_svd(texts: list[str], dimensions: int) -> FloatArray:
    tfidf = np.asarray(build_tfidf_matrix(texts), dtype=np.float64)
    if tfidf.shape[1] == 0:
        return np.zeros((len(texts), 0), dtype=np.float64)
    gram = tfidf @ tfidf.T
    eigenvalues, eigenvectors = np.linalg.eigh(gram)
    order = np.argsort(-eigenvalues)[:dimensions]
    kept = np.clip(eigenvalues[order], 0.0, None)
    keep = kept > VECTOR_NORM_EPSILON
    projected = eigenvectors[:, order][:, keep] * np.sqrt(kept[keep])
    return normalize_rows(np.asarray(projected, dtype=np.float64))


def build_label_features(
    passage_vectors: FloatArray,
    passage_texts: list[str],
    *,
    svd_dimensions: int = SVD_DIMENSIONS,
) -> FloatArray:
    """Centre e5 on the workspace mean, append TF-IDF-SVD, L2-normalise each part and the whole."""
    if passage_vectors.shape[0] != len(passage_texts):
        msg = "passage_texts length must match passage_vectors"
        raise ValueError(msg)
    if passage_vectors.shape[0] == 0:
        return np.zeros((0, 0), dtype=np.float64)
    centred = normalize_rows(passage_vectors - passage_vectors.mean(axis=0, keepdims=True))
    lexical = _tfidf_svd(passage_texts, svd_dimensions)
    return normalize_rows(np.hstack([centred, lexical]))


@dataclass(frozen=True)
class LabelVotes:
    ridge_scores: FloatArray
    ridge: IntArray
    ridge_margin: FloatArray
    hopfield: IntArray
    hopfield_mass: FloatArray
    knn: IntArray

    @property
    def agree(self) -> BoolArray:
        return np.asarray((self.ridge == self.hopfield) & (self.ridge == self.knn), dtype=np.bool_)


def _one_vs_rest_targets(labels: IntArray, num_classes: int) -> FloatArray:
    onehot = np.zeros((labels.shape[0], num_classes), dtype=np.float64)
    onehot[np.arange(labels.shape[0]), labels] = 1.0
    return onehot * 2.0 - 1.0


def _margin(scores: FloatArray) -> FloatArray:
    if scores.shape[1] < _MIN_CLASSES_FOR_MARGIN:
        return np.full(scores.shape[0], np.inf, dtype=np.float64)
    ordered = np.sort(scores, axis=1)
    return np.asarray(ordered[:, -1] - ordered[:, -2], dtype=np.float64)


def _hopfield_and_knn(
    similarity: FloatArray, labels: IntArray, num_classes: int
) -> tuple[IntArray, FloatArray, IntArray]:
    onehot = np.zeros((labels.shape[0], num_classes), dtype=np.float64)
    onehot[np.arange(labels.shape[0]), labels] = 1.0
    finite_max = np.max(
        np.where(np.isfinite(similarity), similarity, -np.inf), axis=1, keepdims=True
    )
    attention = np.exp(HOPFIELD_BETA * (similarity - finite_max))
    attention = attention / attention.sum(axis=1, keepdims=True)
    mass = attention @ onehot
    neighbors = np.argsort(-similarity, axis=1)[:, :KNN_NEIGHBORS]
    knn_scores = np.zeros((similarity.shape[0], num_classes), dtype=np.float64)
    rows = np.arange(similarity.shape[0])[:, None]
    weights = np.where(np.isfinite(similarity[rows, neighbors]), similarity[rows, neighbors], 0.0)
    np.add.at(knn_scores, (np.broadcast_to(rows, neighbors.shape), labels[neighbors]), weights)
    return (
        np.asarray(mass.argmax(axis=1), dtype=np.int64),
        np.asarray(mass.max(axis=1), dtype=np.float64),
        np.asarray(knn_scores.argmax(axis=1), dtype=np.int64),
    )


def predict_label_votes(
    queries: FloatArray, labelled: FloatArray, labels: IntArray, num_classes: int
) -> LabelVotes:
    dim = labelled.shape[1]
    gram = labelled.T @ labelled + RIDGE_LAMBDA * np.eye(dim, dtype=np.float64)
    weights = np.linalg.solve(gram, labelled.T @ _one_vs_rest_targets(labels, num_classes))
    ridge_scores = np.asarray(queries @ weights, dtype=np.float64)
    hopfield, mass, knn = _hopfield_and_knn(queries @ labelled.T, labels, num_classes)
    return LabelVotes(
        ridge_scores=ridge_scores,
        ridge=np.asarray(ridge_scores.argmax(axis=1), dtype=np.int64),
        ridge_margin=_margin(ridge_scores),
        hopfield=hopfield,
        hopfield_mass=mass,
        knn=knn,
    )


def leave_one_out_votes(labelled: FloatArray, labels: IntArray, num_classes: int) -> LabelVotes:
    """Exact leave-one-out votes: Ridge via the hat-matrix identity, the others by self-masking."""
    dim = labelled.shape[1]
    targets = _one_vs_rest_targets(labels, num_classes)
    inverse = np.linalg.inv(labelled.T @ labelled + RIDGE_LAMBDA * np.eye(dim, dtype=np.float64))
    fitted = labelled @ (inverse @ (labelled.T @ targets))
    leverage = np.einsum("ij,jk,ik->i", labelled, inverse, labelled)
    ridge_scores = np.asarray(
        (fitted - leverage[:, None] * targets) / (1.0 - leverage)[:, None], dtype=np.float64
    )
    similarity = labelled @ labelled.T
    np.fill_diagonal(similarity, -np.inf)
    hopfield, mass, knn = _hopfield_and_knn(similarity, labels, num_classes)
    return LabelVotes(
        ridge_scores=ridge_scores,
        ridge=np.asarray(ridge_scores.argmax(axis=1), dtype=np.int64),
        ridge_margin=_margin(ridge_scores),
        hopfield=hopfield,
        hopfield_mass=mass,
        knn=knn,
    )


def learn_auto_accept_margin(
    loo_votes: LabelVotes,
    labels: IntArray,
    *,
    target_precision: float = AUTO_ACCEPT_PRECISION_TARGET,
    min_accepted: int = AUTO_ACCEPT_MIN_EXAMPLES_PER_LABEL,
    accepted_class: int | None = None,
) -> float | None:
    """Smallest Ridge margin whose agreeing leave-one-out predictions reach the target precision.

    Only the workspace's own confirmed labels feed this. ``None`` (never auto-accept) is the
    conservative default whenever fewer than ``min_accepted`` agreeing predictions exist.
    """
    mask = loo_votes.agree
    if accepted_class is not None:
        mask = mask & (loo_votes.ridge == accepted_class)
    margins = loo_votes.ridge_margin[mask]
    correct = (loo_votes.ridge == labels)[mask]
    if margins.size < min_accepted:
        return None
    order = np.argsort(-margins, kind="stable")
    hits = np.cumsum(correct[order])
    counts = np.arange(1, margins.size + 1)
    ok = (hits / counts >= target_precision) & (counts >= min_accepted)
    if not bool(ok.any()):
        return None
    return float(margins[order][int(np.flatnonzero(ok).max())])


def auto_accept_mask(
    votes: LabelVotes,
    *,
    margin_threshold: float | None,
    examples_per_class: IntArray,
) -> BoolArray:
    if margin_threshold is None:
        return np.zeros(votes.ridge.shape[0], dtype=np.bool_)
    enough = examples_per_class[votes.ridge] >= AUTO_ACCEPT_MIN_EXAMPLES_PER_LABEL
    return np.asarray(
        votes.agree & enough & (votes.ridge_margin >= margin_threshold), dtype=np.bool_
    )


def _shrunk_precision(covariance: FloatArray) -> FloatArray:
    dim = covariance.shape[0]
    scale = float(np.trace(covariance)) / max(dim, 1)
    regularised = (
        _COVARIANCE_SHRINKAGE * covariance
        + (1.0 - _COVARIANCE_SHRINKAGE) * scale * np.eye(dim)
        + _COVARIANCE_JITTER * np.eye(dim)
    )
    return np.asarray(np.linalg.inv(regularised), dtype=np.float64)


def _squared_mahalanobis(
    queries: FloatArray, mean: FloatArray, precision: FloatArray
) -> FloatArray:
    delta = queries - mean
    return np.asarray(np.einsum("ij,jk,ik->i", delta, precision, delta), dtype=np.float64)


def relative_mahalanobis_scores(
    queries: FloatArray,
    labelled: FloatArray,
    labels: IntArray,
    background: FloatArray,
) -> FloatArray:
    """Min class Mahalanobis distance minus the distance to a background Gaussian (higher = newer).

    Class means share one shrunk within-class covariance; the background Gaussian is fitted on
    all workspace documents, labelled or not.
    """
    classes = np.unique(labels)
    means = np.stack([labelled[labels == c].mean(axis=0) for c in classes])
    index = np.searchsorted(classes, labels)
    residual = labelled - means[index]
    precision = _shrunk_precision(residual.T @ residual / labelled.shape[0])
    class_distance = np.min(
        np.stack([_squared_mahalanobis(queries, mean, precision) for mean in means], axis=1), axis=1
    )
    centred = background - background.mean(axis=0, keepdims=True)
    background_precision = _shrunk_precision(centred.T @ centred / background.shape[0])
    background_distance = _squared_mahalanobis(
        queries, background.mean(axis=0), background_precision
    )
    return np.asarray(class_distance - background_distance, dtype=np.float64)


def novelty_signal_ready(examples_per_class: IntArray) -> bool:
    """Relative Mahalanobis is uninformative with one example per label (degenerate covariance)."""
    eligible = examples_per_class >= NOVELTY_MIN_EXAMPLES_PER_LABEL
    return int(eligible.sum()) >= NOVELTY_MIN_LABELS
