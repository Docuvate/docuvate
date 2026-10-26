# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Cgroup memory pressure signals for throttling (never exit the worker process)."""

from __future__ import annotations

import os

from docuvate_worker.infrastructure.extract_memory.cgroup import (
    cgroup_memory_available_bytes,
    read_cgroup_memory_snapshot,
)

_ENV_PRESSURE_RATIO = "DOCUVATE_EXTRACT_MEM_PRESSURE_RATIO"
_DEFAULT_PRESSURE_RATIO = 0.88


def _pressure_ratio() -> float:
    raw = os.environ.get(_ENV_PRESSURE_RATIO, "").strip()
    if not raw:
        return _DEFAULT_PRESSURE_RATIO
    try:
        parsed = float(raw)
    except ValueError:
        return _DEFAULT_PRESSURE_RATIO
    if parsed <= 0 or parsed > 1:
        return _DEFAULT_PRESSURE_RATIO
    return parsed


def cgroup_under_memory_pressure() -> bool:
    """True when non-reclaimable cgroup usage is near the hard limit."""
    snapshot = read_cgroup_memory_snapshot()
    if snapshot is None or snapshot.limit_bytes is None or snapshot.limit_bytes <= 0:
        return False
    available = cgroup_memory_available_bytes(
        snapshot,
        headroom_bytes=0,
        reserved_bytes=0,
        count_active_file=False,
    )
    if available is None:
        return False
    used = snapshot.limit_bytes - available
    return used >= int(snapshot.limit_bytes * _pressure_ratio())


def should_defer_pool_recycle() -> bool:
    """Skip planned pool child recycle while the cgroup is under pressure."""
    return cgroup_under_memory_pressure()
