# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Read Linux cgroup v1/v2 memory limits, usage, and reclaimable-aware availability."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

_CGROUP_ROOT = Path("/sys/fs/cgroup")
_OOM_EVENT_FIELD_COUNT = 2
_STAT_LINE_FIELD_COUNT = 2
_STAT_KEY_ANON = "anon"
_STAT_KEY_FILE = "file"
_STAT_KEY_KERNEL = "kernel"
_STAT_KEY_ACTIVE_FILE = "active_file"
_STAT_KEY_INACTIVE_FILE = "inactive_file"
_STAT_KEY_RSS = "rss"
_STAT_KEY_TOTAL_RSS = "total_rss"
_STAT_KEY_CACHE = "cache"
_STAT_KEY_TOTAL_CACHE = "total_cache"


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


def _parse_memory_stat_bytes(path: Path) -> dict[str, int]:
    if not path.is_file():
        return {}
    parsed: dict[str, int] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        parts = line.split()
        if len(parts) != _STAT_LINE_FIELD_COUNT:
            continue
        key = parts[0]
        try:
            parsed[key] = int(parts[1])
        except ValueError:
            continue
    return parsed


def _memory_stat_path() -> Path | None:
    for candidate in (
        _CGROUP_ROOT / "memory.stat",
        Path("/sys/fs/cgroup/memory/memory.stat"),
    ):
        if candidate.is_file():
            return candidate
    return None


@dataclass(frozen=True, slots=True)
class CgroupMemorySnapshot:
    """Point-in-time cgroup memory accounting."""

    limit_bytes: int | None
    current_bytes: int | None
    anon_bytes: int
    kernel_bytes: int
    active_file_bytes: int
    inactive_file_bytes: int
    file_bytes: int


def read_cgroup_memory_snapshot() -> CgroupMemorySnapshot | None:
    limit = cgroup_memory_limit_bytes()
    current = cgroup_memory_current_bytes()
    stat_path = _memory_stat_path()
    if stat_path is None and limit is None and current is None:
        return None
    stat = _parse_memory_stat_bytes(stat_path) if stat_path is not None else {}
    anon = stat.get(_STAT_KEY_ANON, 0)
    if anon <= 0:
        anon = stat.get(_STAT_KEY_RSS, stat.get(_STAT_KEY_TOTAL_RSS, 0))
    kernel = stat.get(_STAT_KEY_KERNEL, 0)
    active_file = stat.get(_STAT_KEY_ACTIVE_FILE, 0)
    inactive_file = stat.get(_STAT_KEY_INACTIVE_FILE, 0)
    file_total = stat.get(_STAT_KEY_FILE, 0)
    if file_total <= 0:
        file_total = stat.get(_STAT_KEY_CACHE, stat.get(_STAT_KEY_TOTAL_CACHE, 0))
    if active_file <= 0 and inactive_file <= 0 and file_total > 0:
        inactive_file = max(0, file_total - active_file)
    return CgroupMemorySnapshot(
        limit_bytes=limit,
        current_bytes=current,
        anon_bytes=max(0, anon),
        kernel_bytes=max(0, kernel),
        active_file_bytes=max(0, active_file),
        inactive_file_bytes=max(0, inactive_file),
        file_bytes=max(0, file_total),
    )


def cgroup_non_reclaimable_bytes(
    snapshot: CgroupMemorySnapshot,
    *,
    count_active_file: bool,
) -> int:
    """Bytes that are not evictable page cache (never count inactive file cache)."""
    reclaimable_file = snapshot.inactive_file_bytes
    if not count_active_file:
        return snapshot.anon_bytes + snapshot.kernel_bytes
    active_component = max(0, snapshot.active_file_bytes)
    if active_component <= 0 and snapshot.file_bytes > reclaimable_file:
        active_component = max(0, snapshot.file_bytes - reclaimable_file)
    return snapshot.anon_bytes + snapshot.kernel_bytes + active_component


def cgroup_memory_available_bytes(
    snapshot: CgroupMemorySnapshot,
    *,
    headroom_bytes: int,
    reserved_bytes: int,
    count_active_file: bool,
) -> int | None:
    """Memory cgroup budget remaining for new extract work."""
    if snapshot.limit_bytes is None:
        return None
    used = cgroup_non_reclaimable_bytes(snapshot, count_active_file=count_active_file)
    remaining = snapshot.limit_bytes - used - headroom_bytes - reserved_bytes
    return max(0, remaining)


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
