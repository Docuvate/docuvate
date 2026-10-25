# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Numerically stable elementary functions for scoring and calibration."""

from __future__ import annotations

import math

import numpy as np
from numpy.typing import NDArray

_LOG_SIGMOID_CLIP = 709.0


def sigmoid(x: float) -> float:
    """Logistic function without math.exp overflow for large |x|."""
    if x >= 0.0:
        if x > _LOG_SIGMOID_CLIP:
            return 1.0
        z = math.exp(-x)
        return 1.0 / (1.0 + z)
    if x < -_LOG_SIGMOID_CLIP:
        return 0.0
    z = math.exp(x)
    return z / (1.0 + z)


def exp_neg_clamped(value: float, *, max_exp_input: float = 700.0) -> float:
    """exp(-value) with the exponent clamped so float64 exp never overflows."""
    clamped = min(max(value, -max_exp_input), max_exp_input)
    return float(math.exp(-clamped))


def softmax(logits: NDArray[np.float64]) -> NDArray[np.float64]:
    shifted = logits - np.max(logits)
    exp = np.exp(shifted)
    total = float(np.sum(exp))
    if total <= 0.0:
        uniform = np.ones_like(logits, dtype=np.float64) / float(max(logits.shape[0], 1))
        return np.asarray(uniform, dtype=np.float64)
    return np.asarray(exp / total, dtype=np.float64)
