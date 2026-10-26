#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Measure docs/min for public scan PDFs at a given extract concurrency (in-process lab mode)."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import resource
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

_WORKER_ROOT = Path(__file__).resolve().parents[2]
if str(_WORKER_ROOT) not in sys.path:
    sys.path.insert(0, str(_WORKER_ROOT))

from docuvate_worker.application.extract import extract_document
from docuvate_worker.infrastructure.extract_memory.cgroup import (
    cgroup_oom_kill_count,
    read_cgroup_memory_snapshot,
)
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


def _fingerprint(result_text: str, blocks: list) -> str:
    payload = result_text + "|" + str(len(blocks))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]


def _percentile(sorted_values: list[float], pct: float) -> float:
    if not sorted_values:
        return 0.0
    index = min(len(sorted_values) - 1, max(0, int(round((pct / 100.0) * len(sorted_values))) - 1))
    return sorted_values[index]


def _read_memory_peak_bytes() -> int | None:
    for path in (
        Path("/sys/fs/cgroup/memory.peak"),
        Path("/sys/fs/cgroup/memory/memory.peak"),
    ):
        if path.is_file():
            raw = path.read_text(encoding="utf-8").strip().split()[0]
            if raw == "max":
                return None
            try:
                return int(raw)
            except ValueError:
                return None
    return None


def _run_one(pdf: bytes, keep_models: bool) -> tuple[float, str]:
    started = time.perf_counter()
    result = extract_document(pdf, "application/pdf", engine="pipeline")
    elapsed = time.perf_counter() - started
    block_count = len(result.blocks or [])
    return elapsed, _fingerprint(result.text, [block_count])


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--concurrency", type=int, default=1)
    parser.add_argument("--rounds", type=int, default=2)
    parser.add_argument("--keep-models", choices=("0", "1"), default="1")
    args = parser.parse_args()

    os.environ.setdefault("DOCUVATE_OCR_BACKEND", "rapidocr")
    os.environ.setdefault("DOCUVATE_ALLOW_IN_PROCESS_EXTRACT", "1")
    os.environ.setdefault("DOCUVATE_EXTRACT_SUBPROCESS", "0")
    os.environ.setdefault("DOCUVATE_EXTRACT_ADMISSION", "0")
    os.environ["DOCUVATE_EXTRACT_KEEP_MODELS"] = args.keep_models

    pdfs = [public_domain_dense_scan_pdf(pages, dpi=dpi) for _, pages, dpi in _CASES]
    warm_pdf = pdfs[0]
    _run_one(warm_pdf, args.keep_models == "1")

    baseline_rss = _peak_rss_mib()
    oom_before = cgroup_oom_kill_count()
    memory_peak_before = _read_memory_peak_bytes()
    started = time.perf_counter()
    fingerprints: list[str] = []
    per_doc_seconds: list[float] = []
    jobs = args.rounds * len(pdfs)
    with ThreadPoolExecutor(max_workers=max(1, args.concurrency)) as pool:
        futures = []
        for _round in range(args.rounds):
            for pdf in pdfs:
                futures.append(pool.submit(_run_one, pdf, args.keep_models == "1"))
        for future in as_completed(futures):
            doc_seconds, fp = future.result()
            per_doc_seconds.append(doc_seconds)
            fingerprints.append(fp)
    elapsed = time.perf_counter() - started
    peak_rss = _peak_rss_mib()
    snapshot = read_cgroup_memory_snapshot()
    oom_after = cgroup_oom_kill_count()
    memory_peak_after = _read_memory_peak_bytes()
    per_doc_seconds.sort()
    docs_per_min = (jobs / elapsed) * 60.0 if elapsed > 0 else 0.0
    print(
        json.dumps(
            {
                "concurrency": args.concurrency,
                "keep_models": args.keep_models == "1",
                "jobs": jobs,
                "wall_seconds": round(elapsed, 3),
                "docs_per_min": round(docs_per_min, 2),
                "per_doc_p50_seconds": round(_percentile(per_doc_seconds, 50), 3),
                "per_doc_p95_seconds": round(_percentile(per_doc_seconds, 95), 3),
                "peak_rss_mib": round(peak_rss, 1),
                "delta_rss_mib": round(peak_rss - baseline_rss, 1),
                "cgroup_current_bytes": snapshot.current_bytes if snapshot else None,
                "cgroup_limit_bytes": snapshot.limit_bytes if snapshot else None,
                "cgroup_memory_peak_bytes": memory_peak_after,
                "cgroup_memory_peak_delta_bytes": (
                    (memory_peak_after - memory_peak_before)
                    if memory_peak_after is not None and memory_peak_before is not None
                    else None
                ),
                "cgroup_oom_kill_delta": (
                    (oom_after - oom_before)
                    if oom_after is not None and oom_before is not None
                    else None
                ),
                "quality_fingerprint_unique": len(set(fingerprints)),
                "quality_fingerprint_sample": fingerprints[0] if fingerprints else None,
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
