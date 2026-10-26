#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Soak /v1/extract on the compose worker (2 GiB cgroup, default env)."""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

_WORKER_ROOT = Path(__file__).resolve().parents[2]
if str(_WORKER_ROOT) not in sys.path:
    sys.path.insert(0, str(_WORKER_ROOT))

from docuvate_worker.infrastructure.extract_memory.cgroup import read_cgroup_memory_snapshot
from tests.public_domain_dense_scans import public_domain_dense_scan_pdf
from tests.synthetic_layout_pdfs import form_disclosure_pdf

_PERMANENT_MARKERS = (
    "extract_permanent_failure",
    "ExtractResourceExhausted",
    "even with models unloaded",
)


def _build_corpus() -> list[tuple[str, bytes]]:
    items: list[tuple[str, bytes]] = []
    items.append(("born_digital", form_disclosure_pdf()))
    for pages in (1, 2, 3):
        for dpi in (120, 150, 180):
            label = f"scan_p{pages}_d{dpi}"
            items.append((label, public_domain_dense_scan_pdf(pages, dpi=dpi)))
    return items


def _get_capacity(base_url: str) -> dict[str, object]:
    request = urllib.request.Request(
        f"{base_url.rstrip('/')}/v1/health/capacity",
        method="GET",
    )
    with urllib.request.urlopen(request, timeout=30.0) as response:
        return json.loads(response.read().decode("utf-8"))


def _post_extract(
    *,
    base_url: str,
    secret: str,
    content: bytes,
    timeout_seconds: float,
) -> tuple[int, str]:
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
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            response.read()
            return response.status, ""
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        return exc.code, detail


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=os.environ.get("WORKER_URL", "http://127.0.0.1:8000"))
    parser.add_argument("--secret", default=os.environ.get("WORKER_SECRET", "worker-shared-secret"))
    parser.add_argument("--minutes", type=float, default=float(os.environ.get("WORKER_SOAK_MINUTES", "15")))
    parser.add_argument("--min-successes", type=int, default=int(os.environ.get("WORKER_SOAK_MIN_DOCS", "50")))
    parser.add_argument("--timeout-seconds", type=float, default=900.0)
    args = parser.parse_args()

    capacity = _get_capacity(args.base_url)
    recommended = int(capacity.get("recommendedConcurrentExtractions", 0) or 0)
    if recommended < 1:
        print(json.dumps({"error": "invalid_capacity", "capacity": capacity}))
        return 1

    corpus = _build_corpus()
    deadline = time.monotonic() + args.minutes * 60.0
    successes = 0
    permanent_memory = 0
    retryable = 0
    other_failures = 0
    peak_cgroup_bytes = 0
    cgroup_limit_bytes: int | None = None
    index = 0
    started = time.monotonic()

    def _sample_cgroup() -> None:
        nonlocal peak_cgroup_bytes, cgroup_limit_bytes
        snapshot = read_cgroup_memory_snapshot()
        if snapshot is None:
            return
        if snapshot.limit_bytes is not None:
            cgroup_limit_bytes = snapshot.limit_bytes
        if snapshot.current_bytes is not None:
            peak_cgroup_bytes = max(peak_cgroup_bytes, snapshot.current_bytes)

    while time.monotonic() < deadline:
        _sample_cgroup()
        label, pdf = corpus[index % len(corpus)]
        index += 1
        status, detail = _post_extract(
            base_url=args.base_url,
            secret=args.secret,
            content=pdf,
            timeout_seconds=args.timeout_seconds,
        )
        if status == 200:
            successes += 1
        elif status == 503:
            retryable += 1
        elif status == 422 and any(marker in detail for marker in _PERMANENT_MARKERS):
            permanent_memory += 1
        else:
            other_failures += 1
    elapsed = time.monotonic() - started
    docs_per_min = (successes / elapsed) * 60.0 if elapsed > 0 else 0.0
    _sample_cgroup()
    result = {
        "mode": "compose_2g_soak",
        "capacity_recommended_slots": recommended,
        "capacity_slots_free": capacity.get("extractSlotsFree"),
        "wall_seconds": round(elapsed, 2),
        "successes": successes,
        "admitted_extracts": successes,
        "permanent_memory_failures": permanent_memory,
        "permanent_422_memory": permanent_memory,
        "retryable_503": retryable,
        "memory_pressure_503": retryable,
        "other_failures": other_failures,
        "docs_per_min": round(docs_per_min, 2),
        "corpus_size": len(corpus),
        "cgroup_peak_mib": round(peak_cgroup_bytes / (1024 * 1024), 1) if peak_cgroup_bytes else 0,
        "cgroup_limit_mib": (
            round(cgroup_limit_bytes / (1024 * 1024), 1) if cgroup_limit_bytes else None
        ),
    }
    print(json.dumps(result))
    if permanent_memory > 0:
        return 2
    if successes < args.min_successes:
        return 3
    if other_failures > 0:
        return 4
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
