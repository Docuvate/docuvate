#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Count-based soak of /v1/extract on the compose worker (2 GiB cgroup, default env).

Every corpus document is extracted ``--passes`` times. Pass criteria: each document ends in
success or a typed worker failure (``detail.errorCode``), zero cgroup OOM kills, and peak cgroup
memory below the limit. Throughput is reported, not gated. Worker restarts are gated by the
wrapper shell script.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path

_WORKER_ROOT = Path(__file__).resolve().parents[2]
if str(_WORKER_ROOT) not in sys.path:
    sys.path.insert(0, str(_WORKER_ROOT))

from docuvate_worker.infrastructure.extract_memory.cgroup import (
    cgroup_oom_kill_count,
    read_cgroup_memory_snapshot,
)
from tests.public_domain_dense_scans import public_domain_dense_scan_pdf
from tests.synthetic_layout_pdfs import form_disclosure_pdf


def _build_corpus() -> list[tuple[str, bytes]]:
    items: list[tuple[str, bytes]] = []
    items.append(("born_digital", form_disclosure_pdf()))
    for pages in (1, 2, 3, 42):
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
        parsed: object = json.loads(response.read().decode("utf-8"))
    if not isinstance(parsed, dict):
        return {}
    return {str(key): value for key, value in parsed.items()}


_HTTP_OK = 200
_HTTP_SERVICE_UNAVAILABLE = 503
_MAX_ATTEMPTS_PER_DOC = 3
_MAX_RETRY_AFTER_SECONDS = 30.0


@dataclass(frozen=True)
class ExtractOutcome:
    status: int
    error_code: str
    error_type: str
    retry_after_seconds: float


def _typed_detail(raw: bytes) -> tuple[str, str]:
    """Return (errorCode, errorType) from a worker error body; empty strings when untyped."""
    try:
        parsed: object = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return "", ""
    if not isinstance(parsed, dict):
        return "", ""
    detail: object = parsed.get("detail")
    if not isinstance(detail, dict):
        return "", ""
    error_code = detail.get("errorCode")
    error_type = detail.get("errorType")
    return (
        error_code if isinstance(error_code, str) else "",
        error_type if isinstance(error_type, str) else "",
    )


def _retry_after(header: str | None) -> float:
    try:
        seconds = float(header) if header is not None else 1.0
    except ValueError:
        seconds = 1.0
    return min(max(seconds, 0.0), _MAX_RETRY_AFTER_SECONDS)


def _post_extract(
    *,
    base_url: str,
    secret: str,
    content: bytes,
    timeout_seconds: float,
) -> ExtractOutcome:
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
            return ExtractOutcome(response.status, "", "", 0.0)
    except urllib.error.HTTPError as exc:
        error_code, error_type = _typed_detail(exc.read())
        return ExtractOutcome(
            exc.code, error_code, error_type, _retry_after(exc.headers.get("Retry-After"))
        )


@dataclass
class SoakTally:
    successes: int = 0
    typed_failures: dict[str, int] = field(default_factory=dict)
    untyped_failures: int = 0
    retried_503: int = 0
    peak_cgroup_bytes: int = 0
    cgroup_limit_bytes: int | None = None

    def sample_cgroup(self) -> None:
        snapshot = read_cgroup_memory_snapshot()
        if snapshot is None:
            return
        if snapshot.limit_bytes is not None:
            self.cgroup_limit_bytes = snapshot.limit_bytes
        if snapshot.current_bytes is not None:
            self.peak_cgroup_bytes = max(self.peak_cgroup_bytes, snapshot.current_bytes)


def _extract_until_final(*, args: argparse.Namespace, pdf: bytes, tally: SoakTally) -> None:
    """One document: retry typed 503s (as BullMQ would), then record the final outcome."""
    for attempt in range(1, _MAX_ATTEMPTS_PER_DOC + 1):
        tally.sample_cgroup()
        outcome = _post_extract(
            base_url=args.base_url,
            secret=args.secret,
            content=pdf,
            timeout_seconds=args.timeout_seconds,
        )
        if outcome.status == _HTTP_OK:
            tally.successes += 1
            return
        if (
            outcome.status == _HTTP_SERVICE_UNAVAILABLE
            and outcome.error_code
            and attempt < _MAX_ATTEMPTS_PER_DOC
        ):
            tally.retried_503 += 1
            time.sleep(outcome.retry_after_seconds)
            continue
        if outcome.error_code:
            key = f"{outcome.status}:{outcome.error_code}:{outcome.error_type}"
            tally.typed_failures[key] = tally.typed_failures.get(key, 0) + 1
        else:
            tally.untyped_failures += 1
        return


def _mib(value: int | None) -> float | None:
    return round(value / (1024 * 1024), 1) if value else None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=os.environ.get("WORKER_URL", "http://127.0.0.1:8000"))
    parser.add_argument("--secret", default=os.environ.get("WORKER_SECRET", "worker-shared-secret"))
    parser.add_argument(
        "--passes", type=int, default=int(os.environ.get("WORKER_SOAK_PASSES", "3"))
    )
    parser.add_argument(
        "--overall-timeout-minutes",
        type=float,
        default=float(os.environ.get("WORKER_SOAK_TIMEOUT_MINUTES", "90")),
    )
    parser.add_argument("--timeout-seconds", type=float, default=900.0)
    args = parser.parse_args()

    capacity = _get_capacity(args.base_url)
    raw_recommended = capacity.get("recommendedConcurrentExtractions")
    recommended = raw_recommended if isinstance(raw_recommended, int) else 0
    if recommended < 1:
        print(json.dumps({"error": "invalid_capacity", "capacity": capacity}))
        return 1

    corpus = _build_corpus()
    planned = len(corpus) * args.passes
    overall_deadline = time.monotonic() + args.overall_timeout_minutes * 60.0
    oom_before = cgroup_oom_kill_count()
    tally = SoakTally()
    attempted = 0
    started = time.monotonic()
    for _pass in range(args.passes):
        for _label, pdf in corpus:
            if time.monotonic() >= overall_deadline:
                break
            attempted += 1
            _extract_until_final(args=args, pdf=pdf, tally=tally)
    elapsed = time.monotonic() - started
    tally.sample_cgroup()
    oom_after = cgroup_oom_kill_count()
    oom_kills = (oom_after - oom_before) if oom_after is not None and oom_before is not None else 0
    after_capacity = _get_capacity(args.base_url)
    typed_total = sum(tally.typed_failures.values())
    result = {
        "mode": "compose_2g_soak_count",
        "capacity_recommended_slots": recommended,
        "capacity_slots_free_after": after_capacity.get("extractSlotsFree"),
        "corpus_size": len(corpus),
        "passes": args.passes,
        "planned_docs": planned,
        "attempted_docs": attempted,
        "successes": tally.successes,
        "typed_failures": typed_total,
        "typed_failures_by_code": tally.typed_failures,
        "untyped_failures": tally.untyped_failures,
        "retried_503": tally.retried_503,
        "cgroup_oom_kills": oom_kills,
        "wall_seconds": round(elapsed, 2),
        "docs_per_min": round((attempted / elapsed) * 60.0, 2) if elapsed > 0 else 0.0,
        "cgroup_peak_mib": _mib(tally.peak_cgroup_bytes) or 0,
        "cgroup_limit_mib": _mib(tally.cgroup_limit_bytes),
    }
    print(json.dumps(result))
    if attempted < planned:
        return 3
    if tally.untyped_failures > 0 or tally.successes + typed_total != planned:
        return 4
    if oom_kills > 0:
        return 6
    if tally.cgroup_limit_bytes is not None and tally.peak_cgroup_bytes >= tally.cgroup_limit_bytes:
        return 7
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
