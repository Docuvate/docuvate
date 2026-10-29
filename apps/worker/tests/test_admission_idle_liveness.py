# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""An idle worker must never refuse extraction forever (CI run 40787000110 regression)."""

import sys

import pytest

from docuvate_worker.infrastructure.extract_memory.admission import (
    ExtractAdmissionController,
    decide_extract_admission,
    extract_admission_slot,
)
from docuvate_worker.infrastructure.extract_memory.cgroup import CgroupMemorySnapshot
from docuvate_worker.infrastructure.extractors.engine_availability import (
    availability_by_id,
    clear_availability_cache,
)
from tests.synthetic_layout_pdfs import form_disclosure_pdf

_ADMISSION = "docuvate_worker.infrastructure.extract_memory.admission"

# Snapshot from the failing smoke run: 2 GiB limit, no job, no pool child, parent
# holding ~1.2 GB anon, so available (after the 550 MB pool respawn reservation) is 0.
_IDLE_AFTER_PRESSURE = CgroupMemorySnapshot(
    limit_bytes=2_147_483_648,
    current_bytes=1_400_000_000,
    anon_bytes=1_250_000_000,
    kernel_bytes=40_000_000,
    active_file_bytes=0,
    inactive_file_bytes=110_000_000,
    file_bytes=110_000_000,
)
_POOL_RESPAWN = 550_000_000


def _decide(*, active_jobs: int, pool_child_alive: bool, minimum: int = 52_000_000) -> str:
    decision = decide_extract_admission(
        snapshot=_IDLE_AFTER_PRESSURE,
        estimate_bytes=194_480_000,
        minimum_chunk_bytes=minimum,
        active_jobs=active_jobs,
        headroom_bytes=300_000_000,
        min_free_bytes=96_000_000,
        reserved_bytes=_POOL_RESPAWN,
        count_active_file=False,
        evictable_model_bytes=0,
        pool_child_alive=pool_child_alive,
    )
    return decision.reason if decision.admit else f"deny:{decision.reason}"


def test_idle_worker_without_pool_child_admits_under_pressure() -> None:
    assert _decide(active_jobs=0, pool_child_alive=False) == "idle_liveness"


def test_idle_worker_with_running_pool_child_waits_for_eviction() -> None:
    assert _decide(active_jobs=0, pool_child_alive=True) == "deny:memory_pressure"


def test_liveness_never_admits_a_document_larger_than_the_cgroup() -> None:
    reason = _decide(active_jobs=0, pool_child_alive=False, minimum=2_000_000_000)
    assert reason == "deny:minimum_chunk_exceeds_cgroup"


def test_liveness_does_not_bypass_concurrent_capacity() -> None:
    assert _decide(active_jobs=1, pool_child_alive=False) == "deny:concurrent_capacity"


def test_controller_reclaims_parent_memory_then_admits_idle_job(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DOCUVATE_EXTRACT_POOL", "1")
    monkeypatch.setenv("DOCUVATE_EXTRACT_POOL_SIZE", "1")
    monkeypatch.setattr(f"{_ADMISSION}.read_cgroup_memory_snapshot", lambda: _IDLE_AFTER_PRESSURE)
    monkeypatch.setattr(f"{_ADMISSION}.pool_memory_reserved_bytes", lambda **_: _POOL_RESPAWN)
    monkeypatch.setattr(f"{_ADMISSION}.evictable_pool_model_bytes", lambda: 0)
    monkeypatch.setattr(f"{_ADMISSION}.pool_child_running", lambda: False)
    reclaims: list[str] = []
    monkeypatch.setattr(
        f"{_ADMISSION}.reclaim_idle_parent_memory", lambda: reclaims.append("parent")
    )

    controller = ExtractAdmissionController()
    decision = controller.try_acquire(194_480_000, 52_000_000)

    assert decision.admit
    assert decision.reason == "idle_liveness"
    assert decision.ticket is not None
    assert reclaims == ["parent"]
    controller.release(decision.ticket)
    assert controller.active_job_count() == 0
    # Repeated idle attempts keep admitting: no state accumulates after release.
    again = controller.try_acquire(194_480_000, 52_000_000)
    assert again.admit
    assert again.reason == "idle_liveness"


def test_controller_skips_reclaim_when_memory_is_free(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    roomy = CgroupMemorySnapshot(
        limit_bytes=2_147_483_648,
        current_bytes=400_000_000,
        anon_bytes=300_000_000,
        kernel_bytes=20_000_000,
        active_file_bytes=0,
        inactive_file_bytes=80_000_000,
        file_bytes=80_000_000,
    )
    monkeypatch.setattr(f"{_ADMISSION}.read_cgroup_memory_snapshot", lambda: roomy)
    monkeypatch.setattr(f"{_ADMISSION}.pool_memory_reserved_bytes", lambda **_: _POOL_RESPAWN)
    monkeypatch.setattr(f"{_ADMISSION}.evictable_pool_model_bytes", lambda: 0)
    monkeypatch.setattr(f"{_ADMISSION}.pool_child_running", lambda: False)
    reclaims: list[str] = []
    monkeypatch.setattr(
        f"{_ADMISSION}.reclaim_idle_parent_memory", lambda: reclaims.append("parent")
    )

    decision = ExtractAdmissionController().try_acquire(194_480_000, 52_000_000)

    assert decision.admit
    assert decision.reason == "idle_first_job"
    assert reclaims == []


def test_admission_slot_enters_on_idle_worker_after_pressure(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DOCUVATE_EXTRACT_ADMISSION", "1")
    monkeypatch.setenv("DOCUVATE_EXTRACT_ADMISSION_WAIT_ATTEMPTS", "1")
    monkeypatch.setattr(f"{_ADMISSION}.read_cgroup_memory_snapshot", lambda: _IDLE_AFTER_PRESSURE)
    monkeypatch.setattr(f"{_ADMISSION}.pool_memory_reserved_bytes", lambda **_: _POOL_RESPAWN)
    monkeypatch.setattr(f"{_ADMISSION}.evictable_pool_model_bytes", lambda: 0)
    monkeypatch.setattr(f"{_ADMISSION}.pool_child_running", lambda: False)
    monkeypatch.setattr(f"{_ADMISSION}.reclaim_idle_parent_memory", lambda: None)
    monkeypatch.setattr(f"{_ADMISSION}.reclaim_model_memory_for_admission", lambda: 0)

    entered = False
    with extract_admission_slot(form_disclosure_pdf(), "application/pdf"):
        entered = True
    assert entered


def test_engine_probes_do_not_import_heavy_modules(monkeypatch: pytest.MonkeyPatch) -> None:
    """GET /v1/extract/engines runs in the API parent; probing must not load paddle/docling."""
    heavy = ("paddleocr", "paddle", "cv2", "docling", "pytesseract", "torch")
    for name in heavy:
        monkeypatch.delitem(sys.modules, name, raising=False)
    clear_availability_cache()
    try:
        availability_by_id()
    finally:
        clear_availability_cache()
    assert [name for name in heavy if name in sys.modules] == []
