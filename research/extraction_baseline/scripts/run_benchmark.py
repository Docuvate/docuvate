#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Run CORD + SROIE extraction benchmarks (test splits)."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

from datasets import load_dataset
from huggingface_hub import dataset_info

from common import (
    RESULTS_DIR,
    aggregate_scores,
    build_field_examples_cord,
    build_field_examples_sroie,
    score_field_level,
)
from extractors import (
    e5_span_extract,
    entity_types_for_dataset,
    gliner_extract,
    layout_kv_extract,
)

os.environ.setdefault("OMP_NUM_THREADS", "4")
os.environ.setdefault("MKL_NUM_THREADS", "4")


def cord_blocks_from_gt(ground_truth_json: str, image_width: int, image_height: int) -> list[dict]:
    import json as json_mod

    payload = json_mod.loads(ground_truth_json)
    width = float(image_width or 1)
    height = float(image_height or 1)
    blocks: list[dict] = []
    for line in payload.get("valid_line", []) or []:
        if not isinstance(line, dict):
            continue
        words = line.get("words") or []
        texts: list[str] = []
        x0, y0, x1, y1 = 1.0, 1.0, 0.0, 0.0
        for word in words:
            if not isinstance(word, dict):
                continue
            text = str(word.get("text", "")).strip()
            quad = word.get("quad")
            if not text or not isinstance(quad, dict):
                continue
            xs = [float(quad[k]) for k in ("x1", "x2", "x3", "x4")]
            ys = [float(quad[k]) for k in ("y1", "y2", "y3", "y4")]
            bx0 = min(xs) / width
            bx1 = max(xs) / width
            by0 = min(ys) / height
            by1 = max(ys) / height
            x0 = min(x0, bx0)
            y0 = min(y0, by0)
            x1 = max(x1, bx1)
            y1 = max(y1, by1)
            texts.append(text)
        merged = " ".join(texts).strip()
        if merged and x1 > x0 and y1 > y0:
            blocks.append(
                {
                    "page": 1,
                    "x": x0,
                    "y": y0,
                    "width": x1 - x0,
                    "height": y1 - y0,
                    "text": merged,
                }
            )
    return blocks


def sroie_blocks(objects: dict, image_width: int, image_height: int) -> list[dict]:
    width = float(image_width or 1)
    height = float(image_height or 1)
    texts = objects.get("text") or []
    bboxes = objects.get("bbox") or []
    blocks: list[dict] = []
    for text, bbox in zip(texts, bboxes, strict=False):
        if not text or not bbox:
            continue
        xs = [float(pair[0]) for pair in bbox]
        ys = [float(pair[1]) for pair in bbox]
        x0 = min(xs) / width
        x1 = max(xs) / width
        y0 = min(ys) / height
        y1 = max(ys) / height
        if x1 <= x0 or y1 <= y0:
            continue
        blocks.append(
            {
                "page": 1,
                "x": x0,
                "y": y0,
                "width": x1 - x0,
                "height": y1 - y0,
                "text": str(text).strip(),
            }
        )
    return blocks


def run_method(
    dataset_name: str,
    examples,
    *,
    method: str,
    abstain_threshold: float | None,
    cord_rows=None,
    sroie_rows=None,
) -> dict:
    entity_types = entity_types_for_dataset(dataset_name)
    per_doc: list[dict] = []
    latencies_ms: list[float] = []

    for idx, ex in enumerate(examples):
        t0 = time.perf_counter()
        if method == "gliner2_zero_shot":
            preds = gliner_extract(ex.text, entity_types)
        elif method == "docuvate_layout_kv":
            if dataset_name == "cord":
                row = cord_rows[idx]
                image = row["image"]
                blocks = cord_blocks_from_gt(
                    row["ground_truth"],
                    int(getattr(image, "width", 1000)),
                    int(getattr(image, "height", 1000)),
                )
            else:
                row = sroie_rows[idx]
                image = row["image"]
                blocks = sroie_blocks(
                    row["objects"],
                    int(getattr(image, "width", 1000)),
                    int(getattr(image, "height", 1000)),
                )
            preds = layout_kv_extract(ex.text, blocks)
        elif method == "e5_token_span":
            labels = list(ex.canonical_gt.keys()) if dataset_name == "sroie" else list(entity_types)
            preds = e5_span_extract(ex.text, labels, abstain_cosine=abstain_threshold or 0.45)
        else:
            msg = f"unknown method {method}"
            raise ValueError(msg)
        latencies_ms.append((time.perf_counter() - t0) * 1000.0)
        per_doc.append(score_field_level(preds, ex.canonical_gt, abstain_threshold=abstain_threshold))

    agg = aggregate_scores(per_doc)
    latencies_ms.sort()
    mid = latencies_ms[len(latencies_ms) // 2] if latencies_ms else 0.0
    p95_idx = int(round(0.95 * (len(latencies_ms) - 1))) if latencies_ms else 0
    agg["latency_ms_median"] = mid
    agg["latency_ms_p95"] = latencies_ms[p95_idx] if latencies_ms else 0.0
    return agg


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-docs", type=int, default=0, help="0 = full split")
    parser.add_argument(
        "--abstain-threshold",
        type=float,
        default=0.5,
        help="Confidence/cosine floor for layout_kv and e5 span (GLiNER API has no scores)",
    )
    args = parser.parse_args()

    cord_info = dataset_info("naver-clova-ix/cord-v2")
    sroie_info = dataset_info("rth/sroie-2019-v2")

    cord_split = "test" if args.max_docs <= 0 else f"test[:{args.max_docs}]"
    sroie_split = "test" if args.max_docs <= 0 else f"test[:{args.max_docs}]"

    cord_ds = load_dataset("naver-clova-ix/cord-v2", split=cord_split)
    sroie_ds = load_dataset("rth/sroie-2019-v2", split=sroie_split)

    cord_rows = [cord_ds[i] for i in range(len(cord_ds))]
    sroie_rows = [sroie_ds[i] for i in range(len(sroie_ds))]

    cord_examples = build_field_examples_cord(cord_rows)
    sroie_examples = build_field_examples_sroie(sroie_rows)

    report = {
        "hardware_threads": int(os.environ.get("OMP_NUM_THREADS", "4")),
        "datasets": {
            "cord": {
                "id": "naver-clova-ix/cord-v2",
                "revision": cord_info.sha,
                "license": (cord_info.card_data or {}).get("license", "cc-by-4.0"),
                "split": "test",
                "documents": len(cord_examples),
            },
            "sroie": {
                "id": "rth/sroie-2019-v2",
                "revision": sroie_info.sha,
                "license_note": (
                    "ICDAR 2019 SROIE Task 3 mirror (626 train / 347 test). "
                    "HF card has no SPDX; competition data is research-oriented — "
                    "verify terms at https://rrc.cvc.uab.es/?ch=13."
                ),
                "split": "test",
                "documents": len(sroie_examples),
            },
        },
        "methods": {},
        "abstain_threshold": args.abstain_threshold,
    }

    for dataset_name, examples, rows in (
        ("cord", cord_examples, cord_rows),
        ("sroie", sroie_examples, sroie_rows),
    ):
        report["methods"][dataset_name] = {}
        for method in ("gliner2_zero_shot", "docuvate_layout_kv", "e5_token_span"):
            abstain = None if method == "gliner2_zero_shot" else args.abstain_threshold
            report["methods"][dataset_name][method] = run_method(
                dataset_name,
                examples,
                method=method,
                abstain_threshold=abstain,
                cord_rows=cord_rows if dataset_name == "cord" else None,
                sroie_rows=sroie_rows if dataset_name == "sroie" else None,
            )

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = RESULTS_DIR / "benchmark_scores.json"
    out_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    raise SystemExit(main())
