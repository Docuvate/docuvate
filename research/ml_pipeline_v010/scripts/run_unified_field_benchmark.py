#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Run unified GLiNER2-base field benchmark (original OCR, document-level F1)."""

from __future__ import annotations

import argparse
import json
import os
import resource
import sys
import time
from pathlib import Path

from datasets import load_dataset
from huggingface_hub import dataset_info

ROOT = Path(__file__).resolve().parents[1]
LIB = ROOT / "lib"
sys.path.insert(0, str(LIB))

from unified_gliner_protocol import (  # noqa: E402
    build_examples_from_rows,
    unified_gliner2_base_metrics,
)

RESULTS = ROOT / "results"
os.environ.setdefault("OMP_NUM_THREADS", "4")
os.environ.setdefault("MKL_NUM_THREADS", "4")
os.environ.setdefault("DOCUVATE_ENCODER_INTRA_OP_THREADS", "4")


def peak_rss_mb() -> float:
    return float(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss) / 1024.0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-docs", type=int, default=0, help="0 = full official test split")
    args = parser.parse_args()

    cord_info = dataset_info("naver-clova-ix/cord-v2")
    sroie_info = dataset_info("rth/sroie-2019-v2")
    cord_split = "test" if args.max_docs <= 0 else f"test[:{args.max_docs}]"
    sroie_split = "test" if args.max_docs <= 0 else f"test[:{args.max_docs}]"

    rss0 = peak_rss_mb()
    t0 = time.perf_counter()
    report: dict[str, object] = {
        "benchmark_kind": "public_dataset_field_extraction",
        "not_synthetic": True,
        "omp_threads": int(os.environ.get("OMP_NUM_THREADS", "4")),
        "peak_rss_mb_start": rss0,
        "datasets": {},
    }

    for name, split in (("cord", cord_split), ("sroie", sroie_split)):
        ds = load_dataset(
            "naver-clova-ix/cord-v2" if name == "cord" else "rth/sroie-2019-v2",
            split=split,
        )
        rows = [ds[i] for i in range(len(ds))]
        examples = build_examples_from_rows(
            name,
            cord_rows=rows if name == "cord" else None,
            sroie_rows=rows if name == "sroie" else None,
        )
        metrics = unified_gliner2_base_metrics(examples, name)
        meta = {
            "hf_id": "naver-clova-ix/cord-v2" if name == "cord" else "rth/sroie-2019-v2",
            "revision": cord_info.sha if name == "cord" else sroie_info.sha,
        }
        report["datasets"][name] = {"meta": meta, "gliner2_base_unified": metrics}

    report["peak_rss_mb_end"] = peak_rss_mb()
    report["wall_seconds"] = time.perf_counter() - t0
    RESULTS.mkdir(parents=True, exist_ok=True)
    out = RESULTS / "unified_gliner2_base.json"
    out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
