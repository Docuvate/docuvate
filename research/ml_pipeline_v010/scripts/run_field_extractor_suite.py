#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Full field extractor comparison under unified protocol (CORD+SROIE test)."""

from __future__ import annotations

import argparse
import csv
import json
import os
import resource
import sys
import time
from dataclasses import asdict
from pathlib import Path

import numpy as np
from datasets import load_dataset
from huggingface_hub import hf_hub_download, model_info
from sklearn.isotonic import IsotonicRegression

ROOT = Path(__file__).resolve().parents[1]
BASELINE_SCRIPTS = ROOT.parents[1] / "research" / "extraction_baseline" / "scripts"
sys.path.insert(0, str(BASELINE_SCRIPTS))
sys.path.insert(0, str(ROOT / "lib"))

from common import (  # noqa: E402
    FieldPrediction,
    aggregate_scores,
    build_field_examples_cord,
    build_field_examples_sroie,
    match_key,
    normalize_value,
    score_field_level,
)
from bootstrap_metrics import bootstrap_micro_f1  # noqa: E402
from field_extractor_backends import (  # noqa: E402
    CACHE_DIR,
    MODEL_SPECS,
    ExtractorId,
    extract_spans,
    unload_all_models,
)
from unified_gliner_protocol import entity_types_for_dataset  # noqa: E402

RESULTS = ROOT / "results"
os.environ.setdefault("OMP_NUM_THREADS", "4")
os.environ.setdefault("MKL_NUM_THREADS", "4")

EXTRACTORS: tuple[ExtractorId, ...] = (
    "gliner2-base-v1",
    "gliner2.5-small-v1",
    "gliner2.5-base-v1",
    "gliner2.5-multi-v1",
)


def peak_rss_mb() -> float:
    return float(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss) / 1024.0


def spans_to_field_predictions(spans: list) -> list[FieldPrediction]:
    by_key: dict[str, FieldPrediction] = {}
    for sp in spans:
        prev = by_key.get(sp.key)
        conf = sp.confidence if sp.confidence is not None else 1.0
        if prev is None or (prev.confidence or 0.0) < conf:
            by_key[sp.key] = FieldPrediction(key=sp.key, value=sp.value, confidence=conf)
    return list(by_key.values())


def span_labels_for_gt(
    spans: list,
    canonical_gt: dict[str, str],
) -> list[tuple[float, int]]:
    """Return (confidence, correct) for each predicted span matched to a GT key."""
    rows: list[tuple[float, int]] = []
    for sp in spans:
        conf = sp.confidence if sp.confidence is not None else 1.0
        gt_val = None
        for gk, gv in canonical_gt.items():
            if match_key(sp.key, gk):
                gt_val = normalize_value(gv)
                break
        if gt_val is None:
            continue
        correct = 1 if normalize_value(sp.value) == gt_val else 0
        rows.append((conf, correct))
    return rows


def precision_coverage_rows(
    labeled: list[tuple[float, int]],
    calibrator: IsotonicRegression | None,
) -> list[tuple[float, float, float]]:
    if not labeled:
        return []
    confs = np.array([c for c, _ in labeled], dtype=np.float64)
    correct = np.array([y for _, y in labeled], dtype=np.int32)
    if calibrator is not None:
        confs = np.clip(calibrator.predict(confs), 0.0, 1.0)
    order = np.argsort(-confs)
    confs = confs[order]
    correct = correct[order]
    rows: list[tuple[float, float, float]] = []
    tp = fp = 0
    total_pos = int(correct.sum())
    for i in range(len(confs)):
        if correct[i]:
            tp += 1
        else:
            fp += 1
        prec = tp / (tp + fp) if (tp + fp) else 1.0
        cov = tp / total_pos if total_pos else 0.0
        rows.append((float(confs[i]), prec, cov))
    return rows


def file_sha256(path: Path) -> str:
    import hashlib

    h = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def model_weight_manifest(extractor_id: ExtractorId) -> dict[str, object]:
    spec = MODEL_SPECS[extractor_id]
    model_id = spec["model_id"]
    info = model_info(model_id)
    revision = spec["hf_revision"] or info.sha
    weight_path = hf_hub_download(
        model_id,
        filename="model.safetensors",
        revision=revision if spec["hf_revision"] else None,
        cache_dir=str(CACHE_DIR),
    )
    path = Path(weight_path)
    return {
        "model_id": model_id,
        "revision": revision,
        "license": spec["license"],
        "weight_file": "model.safetensors",
        "sha256": file_sha256(path),
        "bytes": path.stat().st_size,
    }


def eval_split(
    extractor_id: ExtractorId,
    examples: list,
    dataset: str,
    *,
    calibrator: IsotonicRegression | None,
) -> dict[str, object]:
    entity_types = entity_types_for_dataset(dataset)
    per_doc_scores: list[dict[str, float | int]] = []
    latencies_ms: list[float] = []
    span_labels: list[tuple[float, int]] = []
    t0 = time.perf_counter()
    for ex in examples:
        t1 = time.perf_counter()
        spans = extract_spans(extractor_id, ex.text, entity_types, with_confidence=True)
        latencies_ms.append((time.perf_counter() - t1) * 1000.0)
        preds = spans_to_field_predictions(spans)
        per_doc_scores.append(score_field_level(preds, ex.canonical_gt, abstain_threshold=None))
        span_labels.extend(span_labels_for_gt(spans, ex.canonical_gt))
    wall = time.perf_counter() - t0
    agg = aggregate_scores(per_doc_scores)
    latencies_ms.sort()
    mid = latencies_ms[len(latencies_ms) // 2] if latencies_ms else 0.0
    p95 = latencies_ms[int(round(0.95 * (len(latencies_ms) - 1)))] if latencies_ms else 0.0
    boot = bootstrap_micro_f1(
        [int(d["tp"]) for d in per_doc_scores],
        [int(d["fp"]) for d in per_doc_scores],
        [int(d["fn"]) for d in per_doc_scores],
    )
    pc = precision_coverage_rows(span_labels, calibrator)
    return {
        "micro_precision": agg["micro_precision"],
        "micro_recall": agg["micro_recall"],
        "micro_f1": agg["micro_f1"],
        "exact_match_rate": agg["exact_match_rate"],
        "latency_ms_p50": mid,
        "latency_ms_median": mid,
        "latency_ms_p95": p95,
        "wall_seconds": wall,
        "bootstrap_micro_f1": boot,
        "precision_coverage_points": len(pc),
        "span_labeled_count": len(span_labels),
    }


def fit_calibrator(
    extractor_id: ExtractorId,
    cal_examples: list,
    dataset: str,
) -> IsotonicRegression | None:
    entity_types = entity_types_for_dataset(dataset)
    labeled: list[tuple[float, int]] = []
    for ex in cal_examples:
        spans = extract_spans(extractor_id, ex.text, entity_types, with_confidence=True)
        labeled.extend(span_labels_for_gt(spans, ex.canonical_gt))
    if len(labeled) < 20:
        return None
    x = np.array([c for c, _ in labeled], dtype=np.float64)
    y = np.array([v for _, v in labeled], dtype=np.int32)
    if y.sum() == 0 or y.sum() == len(y):
        return None
    iso = IsotonicRegression(out_of_bounds="clip")
    iso.fit(x, y)
    return iso


def write_pc_csv(path: Path, rows: list[tuple[float, float, float]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["confidence_threshold", "precision", "coverage"])
        for conf, prec, cov in rows:
            writer.writerow([conf, prec, cov])


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--extractors",
        nargs="*",
        default=list(EXTRACTORS),
        choices=list(EXTRACTORS),
    )
    parser.add_argument(
        "--merge-existing",
        action="store_true",
        help="Keep models already present in results/field_extractor_suite.json",
    )
    args = parser.parse_args()

    rss0 = peak_rss_mb()
    out = RESULTS / "field_extractor_suite.json"
    existing_models: dict[str, object] = {}
    if args.merge_existing and out.is_file():
        existing_models = json.loads(out.read_text(encoding="utf-8")).get("models") or {}

    report: dict[str, object] = {
        "benchmark_kind": "public_dataset_field_extraction",
        "protocol": "unified_original_ocr_document_micro_f1",
        "omp_threads": int(os.environ.get("OMP_NUM_THREADS", "4")),
        "peak_rss_mb_start": rss0,
        "models": dict(existing_models),
        "datasets": {},
    }

    cord_train = load_dataset("naver-clova-ix/cord-v2", split="validation")
    cord_test = load_dataset("naver-clova-ix/cord-v2", split="test")
    sroie_train = load_dataset("rth/sroie-2019-v2", split="train")
    sroie_test = load_dataset("rth/sroie-2019-v2", split="test")

    cal_cord = build_field_examples_cord([cord_train[i] for i in range(len(cord_train))])
    test_cord = build_field_examples_cord([cord_test[i] for i in range(len(cord_test))])
    cal_sroie = build_field_examples_sroie([sroie_train[i] for i in range(len(sroie_train))])
    test_sroie = build_field_examples_sroie([sroie_test[i] for i in range(len(sroie_test))])

    for extractor_id in args.extractors:
        spec_entry: dict[str, object] = {
            "manifest": model_weight_manifest(extractor_id),
            "cord": {},
            "sroie": {},
        }
        peak_before = peak_rss_mb()
        calibrator_cord = fit_calibrator(extractor_id, cal_cord, "cord")
        spec_entry["cord"]["test"] = eval_split(
            extractor_id, test_cord, "cord", calibrator=calibrator_cord
        )
        labeled_cord: list[tuple[float, int]] = []
        entity_types = entity_types_for_dataset("cord")
        for ex in test_cord:
            spans = extract_spans(extractor_id, ex.text, entity_types, with_confidence=True)
            labeled_cord.extend(span_labels_for_gt(spans, ex.canonical_gt))
        write_pc_csv(
            RESULTS / "pc" / f"{extractor_id}_cord.csv",
            precision_coverage_rows(labeled_cord, calibrator_cord),
        )

        calibrator_sroie = fit_calibrator(extractor_id, cal_sroie, "sroie")
        spec_entry["sroie"]["test"] = eval_split(
            extractor_id, test_sroie, "sroie", calibrator=calibrator_sroie
        )
        labeled_sroie: list[tuple[float, int]] = []
        entity_types = entity_types_for_dataset("sroie")
        for ex in test_sroie:
            spans = extract_spans(extractor_id, ex.text, entity_types, with_confidence=True)
            labeled_sroie.extend(span_labels_for_gt(spans, ex.canonical_gt))
        write_pc_csv(
            RESULTS / "pc" / f"{extractor_id}_sroie.csv",
            precision_coverage_rows(labeled_sroie, calibrator_sroie),
        )

        spec_entry["peak_rss_mb"] = peak_rss_mb()
        spec_entry["peak_rss_delta_mb"] = spec_entry["peak_rss_mb"] - peak_before
        report["models"][extractor_id] = spec_entry
        unload_all_models()

    report["peak_rss_mb_end"] = peak_rss_mb()
    RESULTS.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
