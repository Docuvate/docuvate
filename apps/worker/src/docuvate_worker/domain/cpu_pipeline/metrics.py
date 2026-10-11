# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Wall-clock and RSS sampling for pipeline stages."""

from __future__ import annotations

import resource
import time
from collections.abc import Callable

from docuvate_worker.domain.cpu_pipeline.contracts import StageMetrics


def _peak_rss_bytes() -> int | None:
    usage = resource.getrusage(resource.RUSAGE_SELF)
    rss = int(usage.ru_maxrss)
    if rss <= 0:
        return None
    # Linux reports kilobytes; macOS reports bytes.
    if rss < 1_000_000:
        return rss * 1024
    return rss


def measure_stage[T](fn: Callable[[], T]) -> tuple[T, StageMetrics]:
    rss_before = _peak_rss_bytes()
    start = time.perf_counter()
    result = fn()
    elapsed_ms = (time.perf_counter() - start) * 1000.0
    rss_after = _peak_rss_bytes()
    peak = rss_after
    if rss_before is not None and rss_after is not None:
        peak = max(rss_before, rss_after)
    return result, StageMetrics(wall_time_ms=elapsed_ms, peak_rss_bytes=peak)
