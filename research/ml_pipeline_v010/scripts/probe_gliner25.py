#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Optional GLiNER2.5 probe on a small public split (CPU). Separate from synthetic unit tests."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

from datasets import load_dataset

ROOT = Path(__file__).resolve().parents[1]
BASELINE_SCRIPTS = ROOT.parents[1] / "research" / "extraction_baseline" / "scripts"
sys.path.insert(0, str(BASELINE_SCRIPTS))
sys.path.insert(0, str(ROOT / "lib"))

from common import build_field_examples_sroie, score_field_level, aggregate_scores  # noqa: E402
from extractors import SROIE_GLINER_ENTITY_TYPES  # noqa: E402

os.environ.setdefault("OMP_NUM_THREADS", "4")

CANDIDATES: tuple[tuple[str, str, str], ...] = (
    ("gliner25_small", "fastino/gliner2.5-small-v1", "Apache-2.0"),
    ("gliner25_base", "fastino/gliner2.5-base-v1", "Apache-2.0"),
)


sys.path.insert(0, str(ROOT / "lib"))
from field_extractor_backends import ExtractorId, extract_spans, load_extractor, unload_all_models  # noqa: E402
from unified_gliner_protocol import entity_types_for_dataset  # noqa: E402

def resolve_extractor_id(model_id: str) -> ExtractorId:
    if model_id == "fastino/gliner2.5-small-v1":
        return "gliner2.5-small-v1"
    if model_id == "fastino/gliner2.5-base-v1":
        return "gliner2.5-base-v1"
    msg = f"unsupported model_id {model_id}"
    raise ValueError(msg)


def extract_gliner25(model_id: str, text: str, labels: list[str]) -> list[tuple[str, str]]:
    eid = resolve_extractor_id(model_id)
    load_extractor(eid)
    spans = extract_spans(eid, text, labels, with_confidence=True)
    return [(sp.key, sp.value) for sp in spans]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-docs", type=int, default=25)
    args = parser.parse_args()

    ds = load_dataset("rth/sroie-2019-v2", split=f"test[:{args.max_docs}]")
    rows = [ds[i] for i in range(len(ds))]
    examples = build_field_examples_sroie(rows)
    labels = list(SROIE_GLINER_ENTITY_TYPES)

    report: dict[str, object] = {
        "benchmark_kind": "public_dataset_field_extraction_subset",
        "dataset": "sroie",
        "documents": len(examples),
        "models": {},
    }

    for slug, model_id, license_spdx in CANDIDATES:
        per_doc = []
        lat: list[float] = []
        status = "ok"
        err: str | None = None
        try:
            for ex in examples:
                t0 = time.perf_counter()
                raw = extract_gliner25(model_id, ex.text, labels)
                lat.append((time.perf_counter() - t0) * 1000.0)
                from common import FieldPrediction

                preds = [FieldPrediction(key=k, value=v, confidence=1.0) for k, v in raw]
                per_doc.append(score_field_level(preds, ex.canonical_gt, abstain_threshold=None))
        except Exception as exc:  # noqa: BLE001 — research probe records failure
            status = "failed"
            err = repr(exc)
            per_doc = []
            lat = []

        entry: dict[str, object] = {
            "model_id": model_id,
            "license": license_spdx,
            "status": status,
        }
        if status == "ok" and per_doc:
            agg = aggregate_scores(per_doc)
            lat.sort()
            entry.update(agg)
            entry["latency_ms_median"] = lat[len(lat) // 2]
        if err:
            entry["error"] = err
        report["models"][slug] = entry
        unload_all_models()

    out_dir = ROOT / "results"
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "gliner25_sroie_probe.json"
    path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
