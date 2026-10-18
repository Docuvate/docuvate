#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import json
import os
import resource
import subprocess
import sys
import time
from pathlib import Path

import psutil

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "scripts"))
sys.path.insert(0, str(ROOT.parent.parent / "apps" / "worker" / "src"))

os.environ["OMP_NUM_THREADS"] = "4"
os.environ["DOCUVATE_ENCODER_INTRA_OP_THREADS"] = "4"


def peak_rss_mb() -> float:
    return float(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss) / 1024.0


def main() -> int:
    from datasets import load_dataset

    from dsre_lib.candidates import generate_candidates
    from dsre_lib.e5_encode import embed_document_token_matrix, embed_queries
    from dsre_lib.evaluate import score_episode, train_head
    from dsre_lib.features import HeadKind
    from dsre_lib.layout_docs import sroie_document
    from dsre_lib.npz_store import DsreNpz

    npz = ROOT / "data" / "sroie.npz"
    if not npz.exists():
        print(json.dumps({"error": "build sroie.npz first"}))
        return 1
    data = DsreNpz.load(npz)
    weights = train_head(data, HeadKind.RELATIONAL)

    lat: list[float] = []
    for ep in range(min(200, len(data.gold))):
        t0 = time.perf_counter()
        score_episode(data, ep, HeadKind.RELATIONAL, weights)
        lat.append((time.perf_counter() - t0) * 1000.0)

    # OCR-excluded: E5 encode one doc
    row = load_dataset("rth/sroie-2019-v2", split="test[0]")[0]
    doc = sroie_document(row, doc_id="sroie-test-0", split_name="test")
    t0 = time.perf_counter()
    cands = generate_candidates(doc)
    embed_document_token_matrix(doc.text)
    embed_queries(["total amount"])
    ocr_excluded_ms = (time.perf_counter() - t0) * 1000.0

    lat.sort()
    report = {
        "omp_threads": 4,
        "docker_8g": False,
        "note": "Docker unavailable; host ulimit not enforced in this sample",
        "dsre_episode_ms_median": lat[len(lat) // 2],
        "dsre_episode_ms_p95": lat[int(0.95 * (len(lat) - 1))],
        "ocr_excluded_e5_candidate_ms": ocr_excluded_ms,
        "peak_rss_mb": peak_rss_mb(),
        "process_rss_mb": psutil.Process().memory_info().rss / (1024 * 1024),
        "hardware": subprocess.check_output(["lscpu"], text=True).splitlines()[:10],
    }
    out = ROOT / "results" / "resource_profile.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
