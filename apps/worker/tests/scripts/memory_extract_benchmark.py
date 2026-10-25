#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Measure peak RSS while extracting a synthetic multi-page scan (optional 2G cgroup).

Usage (from repo root):
  uv run --project apps/worker python apps/worker/tests/scripts/memory_extract_benchmark.py
  docker run --rm --memory=2g ... uv run python apps/worker/tests/scripts/memory_extract_benchmark.py
"""

from __future__ import annotations

import argparse
import os
import resource
import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[4]
if str(_REPO_ROOT / "apps" / "worker" / "src") not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "apps" / "worker" / "src")
if str(_REPO_ROOT / "apps" / "worker") not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "apps" / "worker"))


def _peak_rss_mib() -> float:
    usage = resource.getrusage(resource.RUSAGE_SELF)
    # Linux ru_maxrss is KiB; macOS is bytes.
    if sys.platform == "darwin":
        return usage.ru_maxrss / (1024 * 1024)
    return usage.ru_maxrss / 1024


def main() -> int:
    parser = argparse.ArgumentParser(description="Memory benchmark for worker extract")
    parser.add_argument("--pages", type=int, default=60, help="Synthetic scan page count")
    parser.add_argument(
        "--max-rss-mib",
        type=float,
        default=1536.0,
        help="Fail if peak RSS exceeds this (default 1536 MiB)",
    )
    args = parser.parse_args()

    os.environ.setdefault("DOCUVATE_OCR_BACKEND", "rapidocr")

    from tests.synthetic_scan_pdfs import scanned_image_only_multipage_pdf  # noqa: PLC0415

    from docuvate_worker.application.extract import extract_document  # noqa: PLC0415

    pdf = scanned_image_only_multipage_pdf(page_count=args.pages)
    result = extract_document(pdf, "application/pdf", engine="pipeline")
    peak = _peak_rss_mib()
    print(
        f"pages={args.pages} text_chars={len(result.text)} blocks={len(result.blocks or [])} "
        f"peak_rss_mib={peak:.1f}"
    )
    if peak > args.max_rss_mib:
        print(f"FAIL: peak RSS {peak:.1f} MiB exceeds budget {args.max_rss_mib} MiB", file=sys.stderr)
        return 1
    print("OK: within RSS budget")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
