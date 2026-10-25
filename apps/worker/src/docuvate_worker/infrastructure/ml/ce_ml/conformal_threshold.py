# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import math

import numpy as np
from numpy.typing import NDArray

FloatArray = NDArray[np.float32]

_FALSE_POSITIVE_COST = 3.0
_PRECISION_TARGET = 0.97
_SEQUENTIAL_DELTA = 0.1
_SEQUENTIAL_GRID_STEPS = 40


def split_conformal_accept_threshold(
    calibration_scores: FloatArray,
    calibration_labels: FloatArray,
) -> float | None:
    if calibration_scores.size == 0:
        return None
    order = np.argsort(-calibration_scores)
    scores = calibration_scores[order]
    labels = calibration_labels[order]
    false_positives = np.cumsum(1.0 - labels)
    false_negatives = labels.sum() - np.cumsum(labels)
    cost = _FALSE_POSITIVE_COST * false_positives + false_negatives
    best_index = int(np.argmin(cost))
    return float(scores[best_index])


def sequential_precision_floor(
    base_threshold: float,
    calibration_scores: FloatArray,
    calibration_labels: FloatArray,
) -> float:
    if calibration_scores.size == 0:
        return base_threshold
    grid = sorted(
        {
            float(base_threshold),
            *[
                float(value)
                for value in np.quantile(
                    calibration_scores,
                    np.linspace(0.5, 0.999, _SEQUENTIAL_GRID_STEPS),
                )
            ],
        }
    )
    order = np.argsort(calibration_scores)
    tau = base_threshold
    accepted_labels: list[float] = []
    for score, label in zip(calibration_scores[order], calibration_labels[order], strict=True):
        if score >= tau:
            accepted_labels.append(float(label))
        if not accepted_labels:
            continue
        m = len(accepted_labels)
        precision = sum(accepted_labels) / m
        ucb = precision + math.sqrt(
            (math.log(_SEQUENTIAL_GRID_STEPS / _SEQUENTIAL_DELTA) + 2 * math.log(m + 1)) / (2 * m)
        )
        if ucb < _PRECISION_TARGET:
            for candidate in grid:
                if candidate > tau:
                    tau = candidate
                    break
    return max(tau, base_threshold)
