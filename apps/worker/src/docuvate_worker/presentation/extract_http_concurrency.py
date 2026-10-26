# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Cap concurrent /v1/extract HTTP handlers so health probes keep thread-pool headroom."""

from __future__ import annotations

import os
import threading
from collections.abc import Iterator
from contextlib import contextmanager

from docuvate_worker.infrastructure.extract_memory.extract_concurrency import (
    resolve_extract_concurrency,
)

_ENV_HTTP_EXTRACT_SLOTS = "DOCUVATE_HTTP_EXTRACT_CONCURRENCY"

_extract_slots: threading.Semaphore | None = None
_slots_lock = threading.Lock()


def _slot_count() -> int:
    raw = os.environ.get(_ENV_HTTP_EXTRACT_SLOTS, "").strip()
    if raw.isdigit() and int(raw) > 0:
        return int(raw)
    return max(1, resolve_extract_concurrency())


def _semaphore() -> threading.Semaphore:
    global _extract_slots
    with _slots_lock:
        if _extract_slots is None:
            _extract_slots = threading.Semaphore(_slot_count())
        return _extract_slots


@contextmanager
def extract_http_slot() -> Iterator[None]:
    sem = _semaphore()
    acquired = sem.acquire(blocking=False)
    if not acquired:
        from docuvate_worker.domain.extract_errors import ExtractRetryableError

        raise ExtractRetryableError(
            reason="Worker extract HTTP concurrency limit reached; retry shortly.",
            error_type="ExtractResourceBusy",
        )
    try:
        yield
    finally:
        sem.release()
