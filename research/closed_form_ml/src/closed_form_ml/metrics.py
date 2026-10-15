# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import resource
import time
from dataclasses import dataclass
from typing import Callable, TypeVar

import numpy as np

T = TypeVar("T")


@dataclass(frozen=True)
class MetricWithCi:
    mean: float
    low: float
    high: float
    n: int


def bootstrap_ci(
    values: list[float],
    *,
    n_boot: int = 2000,
    alpha: float = 0.05,
    seed: int = 0,
) -> MetricWithCi:
    if not values:
        return MetricWithCi(0.0, 0.0, 0.0, 0)
    arr = np.asarray(values, dtype=np.float64)
    mean = float(np.mean(arr))
    rng = np.random.default_rng(seed)
    n = len(arr)
    boots = np.empty(n_boot, dtype=np.float64)
    for i in range(n_boot):
        sample = arr[rng.integers(0, n, size=n)]
        boots[i] = float(np.mean(sample))
    low = float(np.quantile(boots, alpha / 2))
    high = float(np.quantile(boots, 1 - alpha / 2))
    return MetricWithCi(mean, low, high, n)


def peak_rss_mb() -> float:
    usage = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    # Linux: kilobytes; macOS: bytes
    if usage > 10_000_000:
        return usage / (1024 * 1024)
    return usage / 1024


@dataclass(frozen=True)
class TimedCall:
    result: object
    latency_ms: float
    peak_rss_mb: float


def timed(fn: Callable[[], T]) -> TimedCall:
    rss_before = peak_rss_mb()
    start = time.perf_counter()
    out = fn()
    elapsed_ms = (time.perf_counter() - start) * 1000.0
    rss_after = peak_rss_mb()
    return TimedCall(out, elapsed_ms, max(rss_before, rss_after))


def learning_curve_fits(
    train_sizes: list[int],
    scores: list[float],
) -> dict[str, float]:
    """Simple over/underfit heuristic: gap between last train-size score and asymptote."""
    if len(scores) < 2:
        return {"train_size_last": float(train_sizes[-1]) if train_sizes else 0.0, "score_gap": 0.0}
    gap = float(scores[-1] - scores[-2])
    return {
        "train_size_last": float(train_sizes[-1]),
        "score_last": float(scores[-1]),
        "score_prev": float(scores[-2]),
        "score_delta": gap,
    }
