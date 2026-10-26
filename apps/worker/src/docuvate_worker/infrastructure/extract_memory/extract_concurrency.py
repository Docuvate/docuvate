# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Default parallel extraction jobs from cgroup memory and CPU."""

from __future__ import annotations

import os

from docuvate_worker.infrastructure.extract_memory.cgroup import read_cgroup_memory_snapshot

_ENV_CONCURRENCY = "DOCUVATE_EXTRACT_CONCURRENCY"
_DEFAULT_RESIDENT_BYTES = 550_000_000
_DEFAULT_BASE_HEADROOM_BYTES = 450_000_000
_DEFAULT_PARENT_RSS_BYTES = 280_000_000
_MAX_DEFAULT_CONCURRENCY = 4


def _env_positive_int(name: str) -> int | None:
    raw = os.environ.get(name, "").strip()
    if not raw.isdigit():
        return None
    parsed = int(raw)
    return parsed if parsed > 0 else None


def default_extract_concurrency() -> int:
    """Heuristic jobs that fit a 2 GiB worker with warm models (~550 MiB incremental each)."""
    cpus = os.cpu_count() or 2
    jobs_by_cpu = max(1, cpus // 2)
    snapshot = read_cgroup_memory_snapshot()
    limit = snapshot.limit_bytes if snapshot is not None else None
    if limit is None or limit <= 0:
        return max(1, min(_MAX_DEFAULT_CONCURRENCY, jobs_by_cpu))
    available_for_jobs = max(
        0,
        limit - _DEFAULT_BASE_HEADROOM_BYTES - _DEFAULT_PARENT_RSS_BYTES,
    )
    jobs_by_mem = max(1, available_for_jobs // _DEFAULT_RESIDENT_BYTES)
    return max(1, min(_MAX_DEFAULT_CONCURRENCY, jobs_by_mem, jobs_by_cpu))


def resolve_extract_concurrency() -> int:
    configured = _env_positive_int(_ENV_CONCURRENCY)
    if configured is not None:
        return configured
    return default_extract_concurrency()


def onnx_intra_op_threads_for_concurrency(concurrency: int) -> int:
    cpus = os.cpu_count() or 2
    per_job = max(1, cpus // max(1, concurrency))
    configured = _env_positive_int("DOCUVATE_ORT_INTRA_OP_THREADS")
    if configured is not None:
        return configured
    return per_job
