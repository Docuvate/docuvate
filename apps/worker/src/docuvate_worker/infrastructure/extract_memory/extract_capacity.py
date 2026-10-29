# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Advertise how many parallel /v1/extract jobs fit the worker cgroup."""

from __future__ import annotations

from dataclasses import dataclass

from docuvate_worker.infrastructure.extract_memory.admission import admission_controller
from docuvate_worker.infrastructure.extract_memory.cgroup import (
    cgroup_memory_available_bytes,
    read_cgroup_memory_snapshot,
)
from docuvate_worker.infrastructure.extract_memory.extract_concurrency import (
    extract_job_footprint_bytes,
    resolve_extract_concurrency,
)
from docuvate_worker.infrastructure.extract_memory.model_residency import (
    evictable_pool_model_bytes,
)
from docuvate_worker.presentation.extract_http_concurrency import http_extract_slots_in_use

_DEFAULT_HEADROOM_BYTES = 300_000_000


@dataclass(frozen=True, slots=True)
class ExtractCapacityReport:
    recommended_concurrent_extractions: int
    active_extract_jobs: int
    extract_slots_free: int
    memory_available_bytes: int | None
    evictable_model_bytes: int
    cgroup_limit_bytes: int | None


def build_extract_capacity_report() -> ExtractCapacityReport:
    snapshot = read_cgroup_memory_snapshot()
    active = admission_controller().active_job_count()
    evictable = evictable_pool_model_bytes()
    available: int | None = None
    if snapshot is not None:
        available = cgroup_memory_available_bytes(
            snapshot,
            headroom_bytes=_DEFAULT_HEADROOM_BYTES,
            reserved_bytes=0,
            count_active_file=False,
        )
    effective = (available or 0) + evictable
    per_job = max(extract_job_footprint_bytes(), 1)
    pool_cap = resolve_extract_concurrency()
    if snapshot is None or snapshot.limit_bytes is None:
        recommended = 1
    else:
        fit = max(1, effective // per_job) if effective > 0 else 1
        recommended = max(1, min(pool_cap, fit))
    free_slots = max(0, recommended - active)
    return ExtractCapacityReport(
        recommended_concurrent_extractions=recommended,
        active_extract_jobs=active,
        extract_slots_free=free_slots,
        memory_available_bytes=available,
        evictable_model_bytes=evictable,
        cgroup_limit_bytes=snapshot.limit_bytes if snapshot is not None else None,
    )


def capacity_report_with_http_slots() -> ExtractCapacityReport:
    report = build_extract_capacity_report()
    http_in_use = http_extract_slots_in_use()
    adjusted_free = max(0, report.extract_slots_free - http_in_use)
    return ExtractCapacityReport(
        recommended_concurrent_extractions=report.recommended_concurrent_extractions,
        active_extract_jobs=report.active_extract_jobs,
        extract_slots_free=adjusted_free,
        memory_available_bytes=report.memory_available_bytes,
        evictable_model_bytes=report.evictable_model_bytes,
        cgroup_limit_bytes=report.cgroup_limit_bytes,
    )
