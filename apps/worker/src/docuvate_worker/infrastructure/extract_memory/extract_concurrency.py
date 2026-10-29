# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Default parallel extraction jobs from cgroup memory and CPU."""

from __future__ import annotations

import os

from docuvate_worker.infrastructure.extract_memory.cgroup import read_cgroup_memory_snapshot

_ENV_CONCURRENCY = "DOCUVATE_EXTRACT_CONCURRENCY"
_DEFAULT_RESIDENT_BYTES = 550_000_000
# Peak incremental working set of one running job on top of the warm child's models
# (raster pages, OCR tensors); measured ~400-830 MB on public dense scans.
_DEFAULT_JOB_WORKING_SET_BYTES = 550_000_000
_DEFAULT_BASE_HEADROOM_BYTES = 450_000_000
DEFAULT_PARENT_RSS_BYTES = 280_000_000
_DEFAULT_PARENT_RSS_BYTES = DEFAULT_PARENT_RSS_BYTES
_MAX_DEFAULT_CONCURRENCY = 4


def _env_positive_int(name: str) -> int | None:
    raw = os.environ.get(name, "").strip()
    if not raw.isdigit():
        return None
    parsed = int(raw)
    return parsed if parsed > 0 else None


def extract_job_footprint_bytes() -> int:
    """Memory one concurrent job needs: its own warm pool child plus the job's working set."""
    return _DEFAULT_RESIDENT_BYTES + _DEFAULT_JOB_WORKING_SET_BYTES


def default_extract_concurrency() -> int:
    """Jobs that fit the cgroup: each needs a warm child (~550 MB) plus its working set.

    A 2 GiB worker fits exactly one job; 4 GiB fits three.
    """
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
    jobs_by_mem = max(1, available_for_jobs // extract_job_footprint_bytes())
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
