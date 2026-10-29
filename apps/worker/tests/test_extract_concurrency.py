# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import pytest

from docuvate_worker.infrastructure.extract_memory.cgroup import CgroupMemorySnapshot
from docuvate_worker.infrastructure.extract_memory.extract_capacity import (
    build_extract_capacity_report,
)
from docuvate_worker.infrastructure.extract_memory.extract_concurrency import (
    default_extract_concurrency,
    resolve_extract_concurrency,
)


def test_default_extract_concurrency_within_bounds(monkeypatch) -> None:
    monkeypatch.delenv("DOCUVATE_EXTRACT_CONCURRENCY", raising=False)
    value = default_extract_concurrency()
    assert value >= 1
    assert value <= 4


def test_resolve_extract_concurrency_honors_env(monkeypatch) -> None:
    monkeypatch.setenv("DOCUVATE_EXTRACT_CONCURRENCY", "3")
    assert resolve_extract_concurrency() == 3


_GIB = 1024 * 1024 * 1024


def _snapshot_with_limit(limit_bytes: int) -> CgroupMemorySnapshot:
    return CgroupMemorySnapshot(
        limit_bytes=limit_bytes,
        current_bytes=300_000_000,
        anon_bytes=280_000_000,
        kernel_bytes=20_000_000,
        active_file_bytes=0,
        inactive_file_bytes=0,
        file_bytes=0,
    )


@pytest.mark.parametrize(
    ("limit_bytes", "expected"),
    [(2 * _GIB, 1), (4 * _GIB, 3)],
)
def test_default_extract_concurrency_matches_memory_reality(
    monkeypatch: pytest.MonkeyPatch,
    limit_bytes: int,
    expected: int,
) -> None:
    monkeypatch.delenv("DOCUVATE_EXTRACT_CONCURRENCY", raising=False)
    monkeypatch.setattr("os.cpu_count", lambda: 16)
    monkeypatch.setattr(
        "docuvate_worker.infrastructure.extract_memory.extract_concurrency.read_cgroup_memory_snapshot",
        lambda: _snapshot_with_limit(limit_bytes),
    )
    assert default_extract_concurrency() == expected


def test_capacity_report_recommends_one_slot_on_2_gib(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("DOCUVATE_EXTRACT_CONCURRENCY", raising=False)
    monkeypatch.setattr("os.cpu_count", lambda: 16)
    for module in ("extract_concurrency", "extract_capacity"):
        monkeypatch.setattr(
            f"docuvate_worker.infrastructure.extract_memory.{module}.read_cgroup_memory_snapshot",
            lambda: _snapshot_with_limit(2 * _GIB),
        )
    monkeypatch.setattr(
        "docuvate_worker.infrastructure.extract_memory.extract_capacity.evictable_pool_model_bytes",
        lambda: 550_000_000,
    )
    assert build_extract_capacity_report().recommended_concurrent_extractions == 1
