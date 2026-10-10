# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Typed wrapper around scipy.stats.beta quantiles for pyright strict."""

from __future__ import annotations

from collections.abc import Callable
from typing import cast

import numpy as np
from numpy.typing import NDArray
from scipy.stats import beta as _beta_dist

_BETA_PPF = cast(Callable[[float, float, float], float], _beta_dist.ppf)


def beta_ppf(quantile: float, alpha: float, beta: float) -> float:
    raw: NDArray[np.float64] = np.asarray(_BETA_PPF(quantile, alpha, beta), dtype=np.float64)
    return float(raw.item())
