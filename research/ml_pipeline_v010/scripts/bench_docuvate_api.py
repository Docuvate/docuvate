#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Read-only smoke against a running Docuvate API (credentials via env only)."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _env(name: str) -> str | None:
    val = os.environ.get(name)
    return val.strip() if val else None


def fetch_json(url: str, headers: dict[str, str]) -> tuple[int, object]:
    req = urllib.request.Request(url, headers=headers, method="GET")
    with urllib.request.urlopen(req, timeout=60) as resp:
        body = resp.read().decode("utf-8")
        return resp.status, json.loads(body) if body else {}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=3, help="Max documents to sample")
    args = parser.parse_args()

    base = _env("DOCUVATE_API_URL")
    token = _env("DOCUVATE_API_TOKEN")
    if not base or not token:
        print(
            "Set DOCUVATE_API_URL and DOCUVATE_API_TOKEN to run against a live instance.",
            file=sys.stderr,
        )
        return 2

    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    report: dict[str, object] = {"base_url": base, "steps": []}

    t0 = time.perf_counter()
    try:
        status, health = fetch_json(f"{base.rstrip('/')}/health", headers)
        report["steps"].append({"health_status": status, "health": health})
    except urllib.error.HTTPError as exc:
        report["steps"].append({"health_error": exc.code, "reason": exc.reason})
        out = ROOT / "results" / "docuvate_api_smoke.json"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        return 1

    try:
        status, docs = fetch_json(
            f"{base.rstrip('/')}/v1/documents?limit={args.limit}",
            headers,
        )
        report["steps"].append({"documents_status": status, "sample": docs})
    except urllib.error.HTTPError as exc:
        report["steps"].append({"documents_error": exc.code, "reason": exc.reason})

    report["wall_seconds"] = time.perf_counter() - t0
    out = ROOT / "results" / "docuvate_api_smoke.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
