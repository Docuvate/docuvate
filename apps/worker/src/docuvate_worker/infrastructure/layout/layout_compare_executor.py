# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Bounded thread pool for CPU-heavy layout compare work."""

from __future__ import annotations

from collections.abc import Callable
from concurrent.futures import Future, ThreadPoolExecutor
from concurrent.futures import TimeoutError as FuturesTimeoutError

from docuvate_worker.infrastructure.layout.layout_compare_errors import (
    CompareErrorCode,
    LayoutCompareError,
)
from docuvate_worker.infrastructure.layout.layout_compare_limits import COMPARE_DEADLINE_SEC

_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="layout-compare")


def run_layout_compare[T](callable_fn: Callable[[], T], *, deadline_sec: int | None = None) -> T:
    timeout = deadline_sec if deadline_sec is not None else COMPARE_DEADLINE_SEC
    future: Future[T] = _executor.submit(callable_fn)
    try:
        return future.result(timeout=timeout)
    except FuturesTimeoutError:
        future.cancel()
        raise LayoutCompareError(CompareErrorCode.TIMEOUT) from None
