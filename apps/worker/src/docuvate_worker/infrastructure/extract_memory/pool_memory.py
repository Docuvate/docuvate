# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Track RSS held by warm extract pool children for cgroup admission."""

from __future__ import annotations

import os
import threading

_ENV_POOL_RESIDENT_BYTES = "DOCUVATE_EXTRACT_POOL_RESIDENT_BYTES"
_DEFAULT_POOL_RESIDENT_BYTES = 550_000_000


def _pool_resident_bytes() -> int:
    raw = os.environ.get(_ENV_POOL_RESIDENT_BYTES, "").strip()
    if raw.isdigit():
        return max(0, int(raw))
    return _DEFAULT_POOL_RESIDENT_BYTES


class _PoolMemoryRegistry:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._spawned_children = 0

    def register_spawned_child(self) -> None:
        with self._lock:
            self._spawned_children += 1

    def unregister_spawned_child(self) -> None:
        with self._lock:
            if self._spawned_children > 0:
                self._spawned_children -= 1

    def spawned_children(self) -> int:
        with self._lock:
            return self._spawned_children

    def reserved_bytes(self) -> int:
        return self.spawned_children() * _pool_resident_bytes()


_pool_memory_registry = _PoolMemoryRegistry()


def pool_memory_registry() -> _PoolMemoryRegistry:
    return _pool_memory_registry


def _pool_size_from_env() -> int:
    from docuvate_worker.infrastructure.extract_memory.extract_concurrency import (
        resolve_extract_concurrency,
    )

    raw = os.environ.get("DOCUVATE_EXTRACT_POOL_SIZE", "").strip()
    if raw.isdigit() and int(raw) > 0:
        return int(raw)
    return resolve_extract_concurrency()


def pool_memory_reserved_bytes(*, pending_jobs: int) -> int:
    """Bytes for warm pool children that exist or will spawn for pending work."""
    if os.environ.get("DOCUVATE_EXTRACT_POOL", "0") != "1":
        return 0
    size = _pool_size_from_env()
    spawned = _pool_memory_registry.spawned_children()
    slots = min(size, max(spawned, pending_jobs))
    return slots * _pool_resident_bytes()
