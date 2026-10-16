#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Measure CPU latency and peak RSS under thread cap (optional Docker cgroup)."""

from __future__ import annotations

import json
import os
import resource
import subprocess
import sys
import time
from pathlib import Path

import psutil
from datasets import load_dataset

REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPTS = Path(__file__).resolve().parent
RESULTS = REPO_ROOT / "research" / "extraction_baseline" / "results"


def peak_rss_mb() -> float:
    usage = resource.getrusage(resource.RUSAGE_SELF)
    # Linux ru_maxrss is KiB
    return float(usage.ru_maxrss) / 1024.0


def sample_run(dataset: str, n_docs: int) -> dict:
    sys.path.insert(0, str(SCRIPTS))
    from common import build_field_examples_cord, build_field_examples_sroie
    from extractors import gliner_extract, layout_kv_extract

    os.environ["OMP_NUM_THREADS"] = "4"
    os.environ["MKL_NUM_THREADS"] = "4"
    os.environ["DOCUVATE_ENCODER_INTRA_OP_THREADS"] = "4"

    if dataset == "cord":
        rows = load_dataset("naver-clova-ix/cord-v2", split=f"test[:{n_docs}]")
        examples = build_field_examples_cord([rows[i] for i in range(len(rows))])
        texts = [ex.text for ex in examples]
    else:
        rows = load_dataset("rth/sroie-2019-v2", split=f"test[:{n_docs}]")
        examples = build_field_examples_sroie([rows[i] for i in range(len(rows))])
        texts = [ex.text for ex in examples]

    lat_gliner: list[float] = []
    for text in texts:
        t0 = time.perf_counter()
        gliner_extract(text, ("company", "date", "address", "total"))
        lat_gliner.append((time.perf_counter() - t0) * 1000.0)

    lat_e5: list[float] = []
    from docuvate_worker.infrastructure.onnx_e5_encoder import embed_texts_onnx  # noqa: E402

    sys.path.insert(0, str(REPO_ROOT / "apps" / "worker" / "src"))
    for text in texts:
        t0 = time.perf_counter()
        embed_texts_onnx([f"passage: {text[:512]}"])
        lat_e5.append((time.perf_counter() - t0) * 1000.0)

    lat_gliner.sort()
    lat_e5.sort()
    mid = lambda arr: arr[len(arr) // 2] if arr else 0.0
    p95 = lambda arr: arr[int(round(0.95 * (len(arr) - 1)))] if arr else 0.0

    return {
        "documents": n_docs,
        "gliner2_ms_median": mid(lat_gliner),
        "gliner2_ms_p95": p95(lat_gliner),
        "e5_embed_ms_median": mid(lat_e5),
        "e5_embed_ms_p95": p95(lat_e5),
        "peak_rss_mb_self": peak_rss_mb(),
        "process_rss_mb": psutil.Process().memory_info().rss / (1024 * 1024),
    }


def main() -> int:
    n_docs = int(os.environ.get("BENCH_LATENCY_DOCS", "30"))
    inner = sample_run("sroie", n_docs)
    cpu_count = os.cpu_count()
    report = {
        "cpu_count_visible": cpu_count,
        "omp_num_threads": os.environ.get("OMP_NUM_THREADS", "4"),
        "memory_limit_note": "Run ./scripts/run_in_cgroup.sh for 8G cap measurements",
        "sroie_sample": inner,
        "hardware": subprocess.check_output(["lscpu"], text=True).splitlines()[:12],
    }
    RESULTS.mkdir(parents=True, exist_ok=True)
    out = RESULTS / "latency_rss.json"
    out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
