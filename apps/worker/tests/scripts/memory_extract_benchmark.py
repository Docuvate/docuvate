#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Measure peak RSS per extraction stage on dense public-domain scan PDFs.

Run inside a 2 GiB cgroup (example):
  docker run --rm --memory=2g --memory-swap=2g \\
    -e DOCUVATE_ALLOW_IN_PROCESS_EXTRACT=1 -e DOCUVATE_EXTRACT_SUBPROCESS=0 \\
    docuvate-worker-cpu uv run python tests/scripts/memory_extract_benchmark.py
"""

from __future__ import annotations

import argparse
import json
import os
import resource
import sys

from docuvate_worker.application.extract import extract_document
from docuvate_worker.infrastructure.extract_memory.profiling import last_memory_profile_report
from tests.public_domain_dense_scans import public_domain_dense_scan_pdf

_CASES: tuple[tuple[str, int, int], ...] = (
    ("scan_20p_300dpi", 20, 300),
    ("scan_35p_280dpi", 35, 280),
    ("scan_50p_260dpi", 50, 260),
)


def _peak_rss_mib() -> float:
    usage = resource.getrusage(resource.RUSAGE_SELF)
    if sys.platform == "darwin":
        return usage.ru_maxrss / (1024 * 1024)
    return usage.ru_maxrss / 1024


def _run_case(name: str, pages: int, dpi: int, max_rss_mib: float) -> int:
    os.environ.setdefault("DOCUVATE_OCR_BACKEND", "rapidocr")
    os.environ.setdefault("DOCUVATE_ALLOW_IN_PROCESS_EXTRACT", "1")
    os.environ.setdefault("DOCUVATE_EXTRACT_SUBPROCESS", "0")
    os.environ.setdefault("DOCUVATE_EXTRACT_ADMISSION", "0")
    os.environ.setdefault("DOCUVATE_DOCAI_SHARE_ENCODER", "1")
    os.environ["DOCUVATE_EXTRACT_MEMORY_PROFILE"] = "1"
    tracemalloc_path = os.environ.get("DOCUVATE_EXTRACT_TRACEMALLOC_PATH")
    if tracemalloc_path and os.path.isfile(tracemalloc_path):
        os.remove(tracemalloc_path)

    pdf = public_domain_dense_scan_pdf(pages, dpi=dpi)
    size_mb = len(pdf) / (1024 * 1024)
    baseline = _peak_rss_mib()
    result = extract_document(pdf, "application/pdf", engine="pipeline")
    peak = _peak_rss_mib()
    report = last_memory_profile_report()
    stage_peaks = report.to_dict() if report is not None else {}
    print(
        f"case={name} pages={pages} dpi={dpi} pdf_mib={size_mb:.2f} "
        f"text_chars={len(result.text)} peak_rss_mib={peak:.1f} delta_mib={peak - baseline:.1f}"
    )
    print("stage_peak_rss_mib=" + json.dumps(stage_peaks, sort_keys=True))
    if report is not None:
        for row in report.stages:
            if row.top_allocations:
                print(f"tracemalloc_top_{row.stage.value}=" + json.dumps(row.top_allocations[:5]))
    if peak > max_rss_mib:
        print(
            f"FAIL {name}: peak RSS {peak:.1f} MiB exceeds budget {max_rss_mib} MiB",
            file=sys.stderr,
        )
        return 1
    print(f"OK {name}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Memory benchmark for worker extract")
    parser.add_argument(
        "--max-rss-mib",
        type=float,
        default=1536.0,
        help="Fail if peak RSS exceeds this (default 1536 MiB)",
    )
    args = parser.parse_args()
    status = 0
    for name, pages, dpi in _CASES:
        status = max(status, _run_case(name, pages, dpi, args.max_rss_mib))
    return status


if __name__ == "__main__":
    raise SystemExit(main())
