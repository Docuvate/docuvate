# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import numpy as np

from dsre_lib.constants import RIDGE_ALPHA


def fit_weighted_ridge(
    x: np.ndarray,
    y: np.ndarray,
    sample_weight: np.ndarray,
    *,
    alpha: float = RIDGE_ALPHA,
) -> np.ndarray:
    """Closed-form ridge; bias column (last) unregularized."""
    dim = x.shape[1]
    reg = np.eye(dim, dtype=np.float64) * alpha
    reg[-1, -1] = 0.0
    wx = x.T * sample_weight
    lhs = x.T @ wx + reg
    rhs = x.T @ (y * sample_weight)
    return np.linalg.solve(lhs, rhs)


def predict_scores(x: np.ndarray, weights: np.ndarray) -> np.ndarray:
    return x @ weights
