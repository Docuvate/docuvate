# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Temperature and class-bias calibration plus learn-then-test precision gates."""

from __future__ import annotations

import logging
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from docuvate_worker.domain.embedding_density.stats_beta import beta_ppf

logger = logging.getLogger(__name__)

COVERAGE_STEPS = (0.02, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.40, 0.50, 0.60)

MIN_BLOCKS_COARSE_099 = 528
MIN_BLOCKS_FINE_095 = 104

# Document-level split fractions (sum to 1.0). Certification must reach MIN_BLOCKS_*.
TRAIN_DOC_FRAC = 0.50
SELECTION_DOC_FRAC = 0.15
CERTIFICATION_DOC_FRAC = 0.25
TEST_DOC_FRAC = 0.10

# With defaults above, certification holds CERTIFICATION_DOC_FRAC of unique documents.
# Coarse auto-apply (0.99): >= MIN_BLOCKS_COARSE_099 certification blocks (~2112 unique docs).
MIN_UNIQUE_DOCUMENTS_FOR_COARSE_READY = 2112
# Fine confirm (0.95): >= MIN_BLOCKS_FINE_095 blocks per label (~416 unique docs each).
MIN_UNIQUE_DOCUMENTS_FOR_FINE_READY_PER_LABEL = 416

TEMPERATURE_GRID_MIN = 0.1
TEMPERATURE_GRID_MAX = 8.0
TEMPERATURE_GRID_SIZE = 80


@dataclass(frozen=True)
class CalibrationThreshold:
    scope: str
    target_id: str
    threshold: float
    lower_bound: float
    coverage: float


@dataclass(frozen=True)
class DocumentLevelSplit:
    train_indices: NDArray[np.int64]
    calibration_indices: NDArray[np.int64]
    test_indices: NDArray[np.int64]


@dataclass(frozen=True)
class EmbeddingDensityDocumentSplit:
    train_indices: NDArray[np.int64]
    selection_indices: NDArray[np.int64]
    certification_indices: NDArray[np.int64]
    test_indices: NDArray[np.int64]


def posterior_log_odds(probability: float) -> float:
    """Log-odds score for LTT so tied posteriors do not saturate at threshold 1.0."""
    p = float(min(max(probability, 1e-15), 1.0 - 1e-15))
    return float(np.log(p / (1.0 - p)))


def softmax(logits: NDArray[np.float64]) -> NDArray[np.float64]:
    shifted = logits - np.max(logits)
    exp = np.exp(shifted)
    total = float(np.sum(exp))
    if total <= 0:
        uniform = np.ones_like(logits, dtype=np.float64) / float(logits.shape[0])
        return np.asarray(uniform, dtype=np.float64)
    return np.asarray(exp / total, dtype=np.float64)


def split_by_document(
    document_ids: list[str],
    *,
    train_frac: float = 0.6,
    calibration_frac: float = 0.2,
    rng: np.random.Generator,
) -> DocumentLevelSplit:
    """Older 3-way split; prefer split_embedding_density_documents for calibration."""
    full = split_embedding_density_documents(
        document_ids,
        rng=rng,
        train_frac=train_frac,
        selection_frac=calibration_frac / 2.0,
        certification_frac=calibration_frac / 2.0,
        test_frac=max(0.0, 1.0 - train_frac - calibration_frac),
    )
    cal_idx = np.concatenate([full.selection_indices, full.certification_indices])
    return DocumentLevelSplit(
        train_indices=full.train_indices,
        calibration_indices=cal_idx,
        test_indices=full.test_indices,
    )


def split_embedding_density_documents(
    document_ids: list[str],
    *,
    rng: np.random.Generator,
    train_frac: float = TRAIN_DOC_FRAC,
    selection_frac: float = SELECTION_DOC_FRAC,
    certification_frac: float = CERTIFICATION_DOC_FRAC,
    test_frac: float = TEST_DOC_FRAC,
) -> EmbeddingDensityDocumentSplit:
    """Partition unique documents into train, selection, certification, and test."""
    unique_docs = list(dict.fromkeys(document_ids))
    rng.shuffle(unique_docs)
    n = len(unique_docs)
    if n == 0:
        empty = np.array([], dtype=np.int64)
        return EmbeddingDensityDocumentSplit(empty, empty, empty, empty)

    n_train = max(1, int(np.floor(train_frac * n))) if n >= 4 else 1  # noqa: PLR2004
    n_sel = max(1, int(np.floor(selection_frac * n))) if n >= 4 else max(0, n - n_train)  # noqa: PLR2004
    n_cert = max(1, int(np.floor(certification_frac * n))) if n >= 4 else 0  # noqa: PLR2004
    n_test = n - n_train - n_sel - n_cert
    if n_test < 0:
        overflow = -n_test
        reduce_cert = min(overflow, max(0, n_cert - 1))
        n_cert -= reduce_cert
        overflow -= reduce_cert
        if overflow > 0:
            reduce_sel = min(overflow, max(0, n_sel - 1))
            n_sel -= reduce_sel
            overflow -= reduce_sel
        if overflow > 0:
            n_train = max(1, n_train - overflow)
        n_test = n - n_train - n_sel - n_cert

    train_docs = set(unique_docs[:n_train])
    sel_docs = set(unique_docs[n_train : n_train + n_sel])
    cert_docs = set(unique_docs[n_train + n_sel : n_train + n_sel + n_cert])
    test_docs = set(unique_docs[n_train + n_sel + n_cert :])

    train_idx: list[int] = []
    sel_idx: list[int] = []
    cert_idx: list[int] = []
    test_idx: list[int] = []
    for i, doc in enumerate(document_ids):
        if doc in train_docs:
            train_idx.append(i)
        elif doc in sel_docs:
            sel_idx.append(i)
        elif doc in cert_docs:
            cert_idx.append(i)
        elif doc in test_docs:
            test_idx.append(i)
    return EmbeddingDensityDocumentSplit(
        train_indices=np.array(train_idx, dtype=np.int64),
        selection_indices=np.array(sel_idx, dtype=np.int64),
        certification_indices=np.array(cert_idx, dtype=np.int64),
        test_indices=np.array(test_idx, dtype=np.int64),
    )


def _nll_with_temperature_bias(
    logits: NDArray[np.float64],
    labels: NDArray[np.int64],
    temperature: float,
    bias: NDArray[np.float64],
) -> float:
    scaled = logits / max(temperature, 1e-6) + bias
    total = 0.0
    for i, y in enumerate(labels):
        probs = softmax(scaled[i])
        p = float(probs[int(y)])
        total -= float(np.log(max(p, 1e-12)))
    return total


def _newton_bias_for_temperature(
    logits: NDArray[np.float64],
    labels: NDArray[np.int64],
    temperature: float,
    *,
    max_steps: int = 25,
) -> NDArray[np.float64]:
    num_classes = logits.shape[1]
    bias = np.zeros(num_classes, dtype=np.float64)
    for _ in range(max_steps):
        scaled = logits / max(temperature, 1e-6) + bias
        grad = np.zeros(num_classes, dtype=np.float64)
        hess = np.zeros((num_classes, num_classes), dtype=np.float64)
        for i, y in enumerate(labels):
            probs = softmax(scaled[i])
            y_int = int(y)
            for c in range(num_classes):
                grad[c] += probs[c] - (1.0 if c == y_int else 0.0)
            for a in range(num_classes):
                for b in range(num_classes):
                    hess[a, b] += probs[a] * (float(a == b) - probs[b])
        try:
            step = np.linalg.solve(hess + np.eye(num_classes) * 1e-4, grad)
        except np.linalg.LinAlgError:
            break
        bias -= step
        if float(np.linalg.norm(step)) < 1e-6:  # noqa: PLR2004
            break
    return bias


def fit_temperature_and_bias(
    logits: NDArray[np.float64],
    labels: NDArray[np.int64],
) -> tuple[float, NDArray[np.float64]]:
    """Grid search beta (temperature) on 80 values; Newton on per-class bias for each."""
    grid = np.linspace(
        np.log(TEMPERATURE_GRID_MIN),
        np.log(TEMPERATURE_GRID_MAX),
        TEMPERATURE_GRID_SIZE,
        dtype=np.float64,
    )
    betas = np.exp(grid)
    best_temp = 1.0
    best_bias = np.zeros(logits.shape[1], dtype=np.float64)
    best_nll = float("inf")
    for beta in betas.tolist():
        bias = _newton_bias_for_temperature(logits, labels, float(beta))
        nll = _nll_with_temperature_bias(logits, labels, float(beta), bias)
        if nll < best_nll:
            best_nll = nll
            best_temp = float(beta)
            best_bias = bias
    if best_temp <= TEMPERATURE_GRID_MIN * 1.02:
        logger.warning(
            "Temperature calibration pinned near grid minimum %.3f (consider widening the grid)",
            TEMPERATURE_GRID_MIN,
        )
    return best_temp, best_bias


def expected_calibration_error(
    logits: NDArray[np.float64],
    labels: NDArray[np.int64],
    temperature: float,
    bias: NDArray[np.float64],
    *,
    num_bins: int = 15,
) -> float:
    scaled = logits / max(temperature, 1e-6) + bias
    confidences: list[float] = []
    accuracies: list[float] = []
    for i, y in enumerate(labels):
        probs = softmax(scaled[i])
        pred = int(np.argmax(probs))
        confidences.append(float(probs[pred]))
        accuracies.append(1.0 if pred == int(y) else 0.0)
    if not confidences:
        return 0.0
    bins = np.linspace(0.0, 1.0, num_bins + 1)
    ece = 0.0
    n = len(confidences)
    for b in range(num_bins):
        lo, hi = bins[b], bins[b + 1]
        mask = [(lo <= c < hi) or (b == num_bins - 1 and c == hi) for c in confidences]
        if not any(mask):
            continue
        idx = [i for i, m in enumerate(mask) if m]
        acc = float(np.mean([accuracies[i] for i in idx]))
        conf = float(np.mean([confidences[i] for i in idx]))
        ece += (len(idx) / n) * abs(acc - conf)
    return float(ece)


def clopper_pearson_lower_bound(successes: int, trials: int, delta: float) -> float:
    if trials == 0:
        return 0.0
    if successes == 0:
        return 0.0
    if successes == trials:
        return beta_ppf(delta, float(successes), 1.0)
    return beta_ppf(delta, float(successes), float(trials - successes + 1))


def learn_then_test_threshold(
    scores: NDArray[np.float64],
    correct: NDArray[np.bool_],
    *,
    target_precision: float,
    delta: float = 0.05,
    scope: str,
    target_id: str,
) -> CalibrationThreshold | None:
    if scores.size == 0:
        return None
    # Bonferroni over coverage stages (paper learn-then-test grid).
    n_stages = len(COVERAGE_STEPS)
    stage_delta = delta / n_stages
    order = np.argsort(-scores)
    best: CalibrationThreshold | None = None
    for cov in COVERAGE_STEPS:
        k = max(1, int(np.floor(cov * scores.size)))
        thresh = float(scores[order[k - 1]])
        accepted = scores >= thresh
        trials = int(np.sum(accepted))
        if trials == 0:
            continue
        successes = int(np.sum(correct[accepted]))
        precision = successes / trials
        lb = clopper_pearson_lower_bound(successes, trials, stage_delta)
        if precision >= target_precision and lb >= target_precision:
            candidate = CalibrationThreshold(
                scope=scope,
                target_id=target_id,
                threshold=thresh,
                lower_bound=lb,
                coverage=float(np.mean(accepted)),
            )
            if best is None or candidate.coverage > best.coverage:
                best = candidate
    return best


def coarse_calibration_ready(coarse_accepted: int, coarse_threshold_certified: bool) -> bool:
    return coarse_threshold_certified and coarse_accepted >= MIN_BLOCKS_COARSE_099


def fine_label_calibration_ready(accepted_blocks: int, threshold_certified: bool) -> bool:
    return threshold_certified and accepted_blocks >= MIN_BLOCKS_FINE_095
