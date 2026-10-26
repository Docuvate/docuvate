# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import pytest

from docuvate_worker.infrastructure.extract_memory.admission import decide_extract_admission
from docuvate_worker.infrastructure.extract_memory.cgroup import CgroupMemorySnapshot
from docuvate_worker.infrastructure.extract_memory.pool_memory import (
    pool_memory_registry,
    pool_memory_reserved_bytes,
)

_TIGHT = CgroupMemorySnapshot(
    limit_bytes=2_147_483_648,
    current_bytes=1_900_000_000,
    anon_bytes=1_700_000_000,
    kernel_bytes=50_000_000,
    active_file_bytes=0,
    inactive_file_bytes=150_000_000,
    file_bytes=150_000_000,
)


def test_pool_memory_reserved_scales_with_pending_jobs(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DOCUVATE_EXTRACT_POOL", "1")
    monkeypatch.setenv("DOCUVATE_EXTRACT_POOL_SIZE", "2")
    registry = pool_memory_registry()
    while registry.spawned_children() > 0:
        registry.unregister_spawned_child()
    assert pool_memory_reserved_bytes(pending_jobs=1) == 550_000_000
    assert pool_memory_reserved_bytes(pending_jobs=2) == 1_100_000_000


def test_pool_reserved_denies_second_job_when_cgroup_tight(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DOCUVATE_EXTRACT_POOL", "1")
    monkeypatch.setenv("DOCUVATE_EXTRACT_POOL_SIZE", "2")
    estimate = 400_000_000
    pool_reserved = pool_memory_reserved_bytes(pending_jobs=2)
    first = decide_extract_admission(
        snapshot=_TIGHT,
        estimate_bytes=estimate,
        minimum_chunk_bytes=80_000_000,
        active_jobs=0,
        headroom_bytes=200_000_000,
        min_free_bytes=64_000_000,
        reserved_bytes=pool_memory_reserved_bytes(pending_jobs=1),
        count_active_file=False,
    )
    second = decide_extract_admission(
        snapshot=_TIGHT,
        estimate_bytes=estimate,
        minimum_chunk_bytes=80_000_000,
        active_jobs=1,
        headroom_bytes=200_000_000,
        min_free_bytes=64_000_000,
        reserved_bytes=estimate + pool_reserved,
        count_active_file=False,
    )
    assert first.admit or first.reason == "minimum_chunk_exceeds_cgroup"
    assert not second.admit
    assert second.reason == "concurrent_capacity"
