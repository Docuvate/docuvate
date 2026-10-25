# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import math

import numpy as np

from docuvate_worker.domain.math_stable import exp_neg_clamped, sigmoid, softmax
from docuvate_worker.infrastructure.ml.value_types.amount_line_ranker import (
    AmountLineRanker,
)


def test_sigmoid_extreme_positive_and_negative() -> None:
    assert sigmoid(0.0) == 0.5
    assert sigmoid(10_000.0) == 1.0
    assert sigmoid(-10_000.0) == 0.0
    for linear in (-1e4, 1e4, -709.0, 709.0):
        _ = sigmoid(linear)


def test_sigmoid_never_raises_overflow() -> None:
    for value in (-1e6, 1e6, -709.0, 709.0):
        score = sigmoid(value)
        assert 0.0 <= score <= 1.0


def test_exp_neg_clamped_handles_huge_distances() -> None:
    assert exp_neg_clamped(0.0) == 1.0
    huge = exp_neg_clamped(1e12)
    assert huge < 1e-200
    assert math.isfinite(huge)


def test_softmax_many_labels_large_logits() -> None:
    logits = np.array([800.0, 799.0, -50.0, 0.0], dtype=np.float64)
    probs = softmax(logits)
    assert np.all(np.isfinite(probs))
    assert abs(float(np.sum(probs)) - 1.0) < 1e-9


def test_amount_line_ranker_extreme_linear() -> None:
    from docuvate_worker.infrastructure.ml.value_types.amount_line_ranker import AmountLineFeatures

    ranker = AmountLineRanker(
        coefficients=tuple(1.0 for _ in range(11)),
        intercept=1e4,
        min_score=0.0,
    )
    features = AmountLineFeatures(
        money_score=1.0,
        money_minus_identifier=0.0,
        money_minus_date=0.0,
        money_minus_address=0.0,
        money_margin_over_non_money=0.0,
        amount_label_e5_cosine=0.0,
        vat_sum_consistency_hint=0.0,
        label_hint=0.0,
        bottom_line_ratio=0.0,
        thousands_sep_hint=0.0,
        token_length=1.0,
    )
    score = ranker.score(features)
    assert 0.0 <= score <= 1.0
