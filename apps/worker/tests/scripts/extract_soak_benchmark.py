# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Soak extract workload under a 2 GiB RSS cap; parent process must not exit."""

from __future__ import annotations

import argparse
import json
import os
import resource
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

_WORKER_ROOT = Path(__file__).resolve().parents[2]
if str(_WORKER_ROOT) not in sys.path:
    sys.path.insert(0, str(_WORKER_ROOT))

from tests.public_domain_dense_scans import public_domain_dense_scan_pdf

_CASES: tuple[tuple[str, int, int], ...] = (
    ("scan_8p_300dpi", 8, 300),
    ("scan_12p_280dpi", 12, 280),
)


def _peak_rss_mib() -> float:
    usage = resource.getrusage(resource.RUSAGE_SELF)
    if sys.platform == "darwin":
        return usage.ru_maxrss / (1024 * 1024)
    return usage.ru_maxrss / 1024


def _read_memory_peak_bytes() -> int | None:
    for path in (
        Path("/sys/fs/cgroup/memory.peak"),
        Path("/sys/fs/cgroup/memory/memory.peak"),
    ):
        if path.is_file():
            raw = path.read_text(encoding="utf-8").strip().split()[0]
            if raw != "max":
                return int(raw)
    return None


def _run_one_bytes(content: bytes) -> float:
    from docuvate_worker.presentation.extract_subprocess_runner import run_extract_isolated

    started = time.perf_counter()
    run_extract_isolated(
        content=content,
        mime_type="application/pdf",
        engine="pipeline",
        embedding_density_state=None,
        build_exact_fact_index=False,
    )
    return time.perf_counter() - started


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--minutes", type=float, default=30.0)
    parser.add_argument("--concurrency", type=int, default=2)
    args = parser.parse_args()

    os.environ.setdefault("DOCUVATE_EXTRACT_SUBPROCESS", "1")
    os.environ.setdefault("DOCUVATE_EXTRACT_POOL", "1")
    os.environ.setdefault("DOCUVATE_EXTRACT_ADMISSION", "1")
    os.environ.setdefault("DOCUVATE_EXTRACT_CONCURRENCY", str(args.concurrency))
    os.environ.setdefault("DOCUVATE_EXTRACT_POOL_SIZE", str(args.concurrency))

    pdfs = [
        public_domain_dense_scan_pdf(pages, dpi=dpi) for _, pages, dpi in _CASES
    ]

    parent_pid = os.getpid()
    print(json.dumps({"phase": "warmup", "parent_pid": parent_pid}), flush=True)
    _run_one_bytes(pdfs[0])
    started_at = time.time()
    deadline = started_at + args.minutes * 60.0
    durations: list[float] = []
    jobs = 0
    peak_before = _read_memory_peak_bytes()

    with ThreadPoolExecutor(max_workers=args.concurrency) as pool:
        index = 0
        futures: set = set()
        while time.time() < deadline or futures:
            while time.time() < deadline and len(futures) < args.concurrency:
                pdf_bytes = pdfs[index % len(pdfs)]
                index += 1
                futures.add(pool.submit(_run_one_bytes, pdf_bytes))
            if not futures:
                break
            done, futures = wait_one(futures)
            for future in done:
                try:
                    durations.append(future.result())
                    jobs += 1
                except Exception as exc:
                    print(json.dumps({"error": str(exc), "jobs_completed": jobs}))
                    return 1

    elapsed = time.time() - started_at
    peak_after = _read_memory_peak_bytes()
    durations_sorted = sorted(durations)
    p50 = durations_sorted[len(durations_sorted) // 2] if durations_sorted else 0.0
    p95_index = max(0, int(len(durations_sorted) * 0.95) - 1)
    p95 = durations_sorted[p95_index] if durations_sorted else 0.0
    result = {
        "soak_minutes": args.minutes,
        "concurrency": args.concurrency,
        "parent_pid": parent_pid,
        "parent_restarts": 0,
        "jobs_completed": jobs,
        "docs_per_min": round(jobs / (elapsed / 60.0), 2) if elapsed > 0 else 0.0,
        "per_doc_p50_seconds": round(p50, 3),
        "per_doc_p95_seconds": round(p95, 3),
        "wall_seconds": round(elapsed, 1),
        "peak_rss_mib": round(_peak_rss_mib(), 1),
        "cgroup_memory_peak_bytes": peak_after,
        "cgroup_memory_peak_delta_bytes": (
            (peak_after - peak_before) if peak_after is not None and peak_before is not None else None
        ),
    }
    print(json.dumps(result))
    return 0


def wait_one(futures: set) -> tuple[set, set]:
    from concurrent.futures import wait

    done, pending = wait(futures, return_when="FIRST_COMPLETED")
    return set(done), set(pending)


if __name__ == "__main__":
    raise SystemExit(main())
