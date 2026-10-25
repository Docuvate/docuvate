# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Read Linux cgroup v2 memory limits and usage (container-aware)."""

from __future__ import annotations

from pathlib import Path

_CGROUP_ROOT = Path("/sys/fs/cgroup")
_OOM_EVENT_FIELD_COUNT = 2


def _read_int_file(path: Path) -> int | None:
    if not path.is_file():
        return None
    raw = path.read_text(encoding="utf-8").strip().split()[0]
    if raw == "max":
        return None
    try:
        return int(raw)
    except ValueError:
        return None


def cgroup_memory_limit_bytes() -> int | None:
    """Hard memory cap for this cgroup, or None when unlimited."""
    for candidate in (
        _CGROUP_ROOT / "memory.max",
        Path("/sys/fs/cgroup/memory/memory.limit_in_bytes"),
    ):
        value = _read_int_file(candidate)
        if value is not None:
            return value
    return None


def cgroup_memory_current_bytes() -> int | None:
    for candidate in (
        _CGROUP_ROOT / "memory.current",
        Path("/sys/fs/cgroup/memory/memory.usage_in_bytes"),
    ):
        value = _read_int_file(candidate)
        if value is not None:
            return value
    return None


def cgroup_oom_kill_count() -> int | None:
    events = _CGROUP_ROOT / "memory.events"
    if not events.is_file():
        return None
    for line in events.read_text(encoding="utf-8").splitlines():
        parts = line.split()
        if len(parts) == _OOM_EVENT_FIELD_COUNT and parts[0] == "oom_kill":
            try:
                return int(parts[1])
            except ValueError:
                return None
    return None
