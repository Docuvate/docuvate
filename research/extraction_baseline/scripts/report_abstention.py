#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Report precision at several abstention thresholds (layout_kv + e5 span)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from datasets import load_dataset

from common import (
    RESULTS_DIR,
    aggregate_scores,
    build_field_examples_cord,
    build_field_examples_sroie,
    score_field_level,
)
from run_benchmark import cord_blocks_from_gt, run_method, sroie_blocks

THRESHOLDS = (0.3, 0.5, 0.7, 0.85)


def main() -> int:
    cord_rows = [load_dataset("naver-clova-ix/cord-v2", split="test")[i] for i in range(100)]
    sroie_rows = [load_dataset("rth/sroie-2019-v2", split="test")[i] for i in range(347)]
    cord_examples = build_field_examples_cord(cord_rows)
    sroie_examples = build_field_examples_sroie(sroie_rows)

    out: dict[str, object] = {}
    for dataset_name, examples, rows in (
        ("cord", cord_examples, cord_rows),
        ("sroie", sroie_examples, sroie_rows),
    ):
        out[dataset_name] = {}
        for method in ("docuvate_layout_kv", "e5_token_span"):
            out[dataset_name][method] = {}
            for tau in THRESHOLDS:
                per_doc = []
                entity_types = None
                from extractors import entity_types_for_dataset

                entity_types = entity_types_for_dataset(dataset_name)
                for idx, ex in enumerate(examples):
                    if method == "docuvate_layout_kv":
                        if dataset_name == "cord":
                            row = rows[idx]
                            image = row["image"]
                            blocks = cord_blocks_from_gt(
                                row["ground_truth"],
                                int(getattr(image, "width", 1000)),
                                int(getattr(image, "height", 1000)),
                            )
                        else:
                            row = rows[idx]
                            image = row["image"]
                            blocks = sroie_blocks(
                                row["objects"],
                                int(getattr(image, "width", 1000)),
                                int(getattr(image, "height", 1000)),
                            )
                        from extractors import layout_kv_extract

                        preds = layout_kv_extract(ex.text, blocks)
                    else:
                        from extractors import e5_span_extract

                        labels = (
                            list(ex.canonical_gt.keys())
                            if dataset_name == "sroie"
                            else list(entity_types)
                        )
                        preds = e5_span_extract(ex.text, labels, abstain_cosine=tau)
                    per_doc.append(
                        score_field_level(preds, ex.canonical_gt, abstain_threshold=tau)
                    )
                agg = aggregate_scores(per_doc)
                coverage = 1.0 - (
                    sum(int(d["fn"]) for d in per_doc)
                    / max(1, sum(len(ex.canonical_gt) for ex in examples))
                )
                out[dataset_name][method][str(tau)] = {
                    "micro_precision": agg["micro_precision"],
                    "micro_recall": agg["micro_recall"],
                    "micro_f1": agg["micro_f1"],
                    "field_coverage_proxy": coverage,
                }

    path = RESULTS_DIR / "abstention_curves.json"
    path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    raise SystemExit(main())
