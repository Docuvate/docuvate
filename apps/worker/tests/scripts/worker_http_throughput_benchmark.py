#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Measure docs/min via POST /v1/extract on the running compose worker (default env, pool on)."""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

_WORKER_ROOT = Path(__file__).resolve().parents[2]
if str(_WORKER_ROOT) not in sys.path:
    sys.path.insert(0, str(_WORKER_ROOT))

from tests.public_domain_dense_scans import public_domain_dense_scan_pdf
from tests.synthetic_layout_pdfs import form_disclosure_pdf

_STRESS_CASES: tuple[tuple[int, int], ...] = ((8, 300), (12, 280))


def _resolve_pdfs(workload: str) -> list[bytes]:
    if workload == "stress":
        return [public_domain_dense_scan_pdf(pages, dpi=dpi) for pages, dpi in _STRESS_CASES]
    # Born-digital PDF: exercises /v1/extract on a 2GiB compose worker without scan raster budget.
    sample = form_disclosure_pdf()
    return [sample, sample]


def _percentile(sorted_values: list[float], p: float) -> float:
    if not sorted_values:
        return 0.0
    index = min(len(sorted_values) - 1, int((p / 100.0) * len(sorted_values)))
    return sorted_values[max(0, index)]


def _post_extract(
    *,
    base_url: str,
    secret: str,
    content: bytes,
    timeout_seconds: float,
) -> float:
    payload = {
        "content_base64": base64.b64encode(content).decode("ascii"),
        "mime_type": "application/pdf",
        "build_exact_fact_index": False,
    }
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        f"{base_url.rstrip('/')}/v1/extract",
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-Worker-Secret": secret,
        },
    )
    started = time.perf_counter()
    with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
        if response.status >= 400:
            raise RuntimeError(f"HTTP {response.status}")
        response.read()
    return time.perf_counter() - started


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=os.environ.get("WORKER_URL", "http://127.0.0.1:8000"))
    parser.add_argument("--secret", default=os.environ.get("WORKER_SECRET", "worker-shared-secret"))
    parser.add_argument("--rounds", type=int, default=2)
    parser.add_argument("--concurrency", type=int, default=2)
    parser.add_argument("--timeout-seconds", type=float, default=900.0)
    parser.add_argument(
        "--workload",
        default=os.environ.get("WORKER_HTTP_BENCH_WORKLOAD", "compose_2g"),
        choices=("compose_2g", "stress"),
        help="compose_2g: single-page scans that pass 2GiB admission; stress: multi-page lab PDFs",
    )
    args = parser.parse_args()

    pdfs = _resolve_pdfs(args.workload)
    jobs = args.rounds * len(pdfs)
    durations: list[float] = []
    started = time.perf_counter()
    with ThreadPoolExecutor(max_workers=max(1, args.concurrency)) as pool:
        futures = []
        for _ in range(args.rounds):
            for pdf in pdfs:
                futures.append(
                    pool.submit(
                        _post_extract,
                        base_url=args.base_url,
                        secret=args.secret,
                        content=pdf,
                        timeout_seconds=args.timeout_seconds,
                    )
                )
        for future in as_completed(futures):
            try:
                durations.append(future.result())
            except urllib.error.HTTPError as exc:
                detail = exc.read().decode("utf-8", errors="replace")[:500]
                print(json.dumps({"error": f"HTTP {exc.code}", "detail": detail}))
                return 1
            except Exception as exc:
                print(json.dumps({"error": str(exc)}))
                return 1
    elapsed = time.perf_counter() - started
    durations.sort()
    result = {
        "mode": "http_extract_compose_worker",
        "workload": args.workload,
        "concurrency": args.concurrency,
        "jobs": jobs,
        "wall_seconds": round(elapsed, 3),
        "docs_per_min": round((jobs / elapsed) * 60.0, 2) if elapsed > 0 else 0.0,
        "per_doc_p50_seconds": round(_percentile(durations, 50), 3),
        "per_doc_p95_seconds": round(_percentile(durations, 95), 3),
        "pool": os.environ.get("DOCUVATE_EXTRACT_POOL"),
        "admission": os.environ.get("DOCUVATE_EXTRACT_ADMISSION"),
    }
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
