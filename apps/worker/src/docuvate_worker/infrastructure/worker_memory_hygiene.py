# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Best-effort return of native heap (Paddle/ONNX) to the interpreter after heavy work."""

from __future__ import annotations

import ctypes
import ctypes.util
import gc
import logging

logger = logging.getLogger(__name__)


def reclaim_python_heap() -> None:
    gc.collect()


def _malloc_trim() -> bool:
    """Ask glibc to return freed arenas to the OS; False where unsupported (musl, macOS)."""
    libc_name = ctypes.util.find_library("c")
    if libc_name is None:
        return False
    try:
        libc = ctypes.CDLL(libc_name)
        trim = libc.malloc_trim
    except (OSError, AttributeError):
        return False
    trim.argtypes = [ctypes.c_size_t]
    trim.restype = ctypes.c_int
    released: int = trim(0)
    return released == 1


def reclaim_process_heap() -> None:
    """Collect garbage and hand freed native heap back so cgroup anon usage drops."""
    gc.collect()
    trimmed = _malloc_trim()
    logger.debug("process_heap_reclaimed malloc_trim=%s", trimmed)
