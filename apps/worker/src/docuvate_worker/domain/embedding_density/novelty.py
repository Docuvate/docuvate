# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Novelty detection via marginal log-density quantiles."""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray


def fit_novelty_threshold(
    log_densities: NDArray[np.float64],
    alpha: float = 0.01,
) -> float:
    """Return the alpha quantile of in-distribution log p(x) (lower tail)."""
    if log_densities.size == 0:
        return float("-inf")
    q = float(np.quantile(log_densities, alpha))
    return q


def is_novel(log_px: float, threshold: float) -> bool:
    return log_px < threshold
