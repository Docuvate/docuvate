#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Explain F1/latency deltas between extraction_baseline vs DSRE GLiNER runs."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]


def main() -> int:
    baseline = json.loads(
        (REPO / "research/extraction_baseline/results/benchmark_scores.json").read_text(
            encoding="utf-8"
        )
    )
    dsre = json.loads(
        (REPO / "research/extraction_baseline/dsre/results/core_benchmark_summary.json").read_text(
            encoding="utf-8"
        )
    )
    unified_path = ROOT / "results/unified_gliner2_base.json"
    unified = (
        json.loads(unified_path.read_text(encoding="utf-8")) if unified_path.exists() else None
    )

    rows: list[dict[str, object]] = []
    for ds in ("cord", "sroie"):
        b = baseline["methods"][ds]["gliner2_zero_shot"]
        d = dsre["datasets"][ds]["gliner2"]
        row: dict[str, object] = {
            "dataset": ds,
            "extraction_baseline_f1": b["micro_f1"],
            "extraction_baseline_latency_ms_median": b["latency_ms_median"],
            "dsre_npz_episode_f1": d["micro_f1"],
            "dsre_npz_latency_ms_median": d["latency_ms_per_document_median"],
            "root_causes": [
                "DSRE scores one gold field per episode (first GLiNER span only), not document-level canonical_gt.",
                "DSRE rebuilds text from deduplicated candidate lines and truncates to 3500 chars, not full OCR lines.",
                "DSRE infers once per NPZ doc_id (may differ from HF test doc count); latency measured inside heavy DSRE process.",
            ],
            "canonical_protocol": "research/ml_pipeline_v010/lib/unified_gliner_protocol.py",
        }
        if unified is not None:
            u = unified["datasets"][ds]["gliner2_base_unified"]
            row["unified_f1"] = u["micro_f1"]
            row["unified_latency_ms_median"] = u["latency_ms_median"]
        rows.append(row)

    out = {
        "summary": (
            "Use unified_gliner_protocol (original OCR, document-level micro-F1, one batch_extract per doc) "
            "for all v0.1.0 comparisons. Earlier DSRE GLiNER numbers are episode-level and not comparable to F1≈0.42."
        ),
        "rows": rows,
    }
    RESULTS = ROOT / "results"
    RESULTS.mkdir(parents=True, exist_ok=True)
    path = RESULTS / "gliner_protocol_reconciliation.json"
    path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
