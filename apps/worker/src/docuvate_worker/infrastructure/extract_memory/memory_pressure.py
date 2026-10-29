# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Cgroup memory pressure signals for throttling (never exit the worker process)."""

from __future__ import annotations

import os

from docuvate_worker.infrastructure.extract_memory.cgroup import (
    cgroup_memory_available_bytes,
    cgroup_non_reclaimable_bytes,
    read_cgroup_memory_snapshot,
)

_ENV_PRESSURE_RATIO = "DOCUVATE_EXTRACT_MEM_PRESSURE_RATIO"
_ENV_RECLAIM_RATIO = "DOCUVATE_EXTRACT_MEM_IDLE_RECLAIM_RATIO"
_DEFAULT_PRESSURE_RATIO = 0.90
_DEFAULT_IDLE_RECLAIM_RATIO = 0.90


def _ratio_from_env(name: str, default: float) -> float:
    raw = os.environ.get(name, "").strip()
    if not raw:
        return default
    try:
        parsed = float(raw)
    except ValueError:
        return default
    if parsed <= 0 or parsed > 1:
        return default
    return parsed


def _pressure_ratio() -> float:
    return _ratio_from_env(_ENV_PRESSURE_RATIO, _DEFAULT_PRESSURE_RATIO)


def _idle_reclaim_ratio() -> float:
    return _ratio_from_env(_ENV_RECLAIM_RATIO, _DEFAULT_IDLE_RECLAIM_RATIO)


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


def cgroup_should_reclaim_idle_models() -> bool:
    """True when cgroup non-reclaimable usage exceeds the idle model reclaim threshold."""
    snapshot = read_cgroup_memory_snapshot()
    if snapshot is None or snapshot.limit_bytes is None or snapshot.limit_bytes <= 0:
        return False
    used = cgroup_non_reclaimable_bytes(snapshot, count_active_file=False)
    return used >= int(snapshot.limit_bytes * _idle_reclaim_ratio())
