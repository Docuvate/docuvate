#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Measure peak RSS per extraction stage on synthetic multi-page scans.

Usage (from apps/worker):
  uv run python tests/scripts/memory_extract_benchmark.py --pages 50 --dpi 300
"""

from __future__ import annotations

import argparse
import json
import os
import resource
import sys

from docuvate_worker.application.extract import extract_document
from docuvate_worker.infrastructure.extract_memory.profiling import last_memory_profile_report
from tests.synthetic_scan_pdfs import scanned_image_only_multipage_pdf


def _peak_rss_mib() -> float:
    usage = resource.getrusage(resource.RUSAGE_SELF)
    if sys.platform == "darwin":
        return usage.ru_maxrss / (1024 * 1024)
    return usage.ru_maxrss / 1024


def main() -> int:
    parser = argparse.ArgumentParser(description="Memory benchmark for worker extract")
    parser.add_argument("--pages", type=int, default=50, help="Synthetic scan page count")
    parser.add_argument("--dpi", type=int, default=300, help="Raster DPI for synthetic PDF")
    parser.add_argument(
        "--max-rss-mib",
        type=float,
        default=1536.0,
        help="Fail if peak RSS exceeds this (default 1536 MiB)",
    )
    args = parser.parse_args()

    os.environ.setdefault("DOCUVATE_OCR_BACKEND", "rapidocr")
    os.environ.setdefault("DOCUVATE_ALLOW_IN_PROCESS_EXTRACT", "1")
    os.environ.setdefault("DOCUVATE_EXTRACT_SUBPROCESS", "0")
    os.environ.setdefault("DOCUVATE_EXTRACT_ADMISSION", "0")
    os.environ["DOCUVATE_EXTRACT_MEMORY_PROFILE"] = "1"

    pdf = scanned_image_only_multipage_pdf(page_count=args.pages, dpi=args.dpi)
    baseline = _peak_rss_mib()
    result = extract_document(pdf, "application/pdf", engine="pipeline")
    peak = _peak_rss_mib()
    report = last_memory_profile_report()
    stage_peaks = report.to_dict() if report is not None else {}

    print(
        f"pages={args.pages} dpi={args.dpi} text_chars={len(result.text)} "
        f"blocks={len(result.blocks or [])} peak_rss_mib={peak:.1f} delta_mib={peak - baseline:.1f}"
    )
    if stage_peaks:
        print("stage_peak_rss_mib=" + json.dumps(stage_peaks, sort_keys=True))
    if peak > args.max_rss_mib:
        print(
            f"FAIL: peak RSS {peak:.1f} MiB exceeds budget {args.max_rss_mib} MiB",
            file=sys.stderr,
        )
        return 1
    print("OK: within RSS budget")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
