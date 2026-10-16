#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import argparse
import csv
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

from dsre_lib.constants import CORD_SCHEMA, SROIE_SCHEMA, SPLIT_TEST, SPLIT_TRAIN
from dsre_lib.evaluate import (
    candidate_recall,
    episode_score_cache,
    evaluate_head,
    score_episode,
    train_head,
)
from dsre_lib.features import HeadKind
from dsre_lib.npz_store import DsreNpz


def gliner_eval(data: DsreNpz, schema_keys: list[str]) -> dict[str, float]:
    from dsre_lib.gliner_baseline import gliner_predictions_for_npz

    return gliner_predictions_for_npz(data, schema_keys)


def precision_coverage_curve(
    data: DsreNpz,
    cache: list[tuple[float, int, int]],
    out_csv: Path,
    out_png: Path,
) -> None:
    thresholds = np.linspace(-1.0, 1.0, 21)
    rows = []
    for tau in thresholds:
        tp = fp = fn = 0
        for ep, (score, pred_idx, gold) in enumerate(cache):
            if int(data.split[ep]) != SPLIT_TEST:
                continue
            if data.field_absent[ep]:
                continue
            if score < tau:
                fn += 1
                continue
            if gold >= 0 and pred_idx == gold:
                tp += 1
            else:
                fp += 1
                fn += 1
        prec = tp / (tp + fp) if (tp + fp) else 1.0
        cov = tp / (tp + fn) if (tp + fn) else 0.0
        rows.append((tau, prec, cov, tp, fp, fn))
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    with out_csv.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["threshold", "precision", "coverage", "tp", "fp", "fn"])
        writer.writerows(rows)
    plt.figure(figsize=(6, 4))
    plt.plot([r[2] for r in rows], [r[1] for r in rows], marker=".")
    plt.xlabel("coverage")
    plt.ylabel("precision")
    plt.title("Precision–coverage (test)")
    plt.grid(True, alpha=0.3)
    plt.savefig(out_png, dpi=120, bbox_inches="tight")
    plt.close()


def learning_curve(data: DsreNpz, kind: HeadKind) -> list[dict[str, float]]:
    train_eps = [i for i, s in enumerate(data.split) if int(s) == SPLIT_TRAIN]
    fractions = [0.15, 0.4, 0.7, 1.0]
    out: list[dict[str, float]] = []
    rng = np.random.default_rng(7)
    for frac in fractions:
        k = max(5, int(len(train_eps) * frac))
        chosen = set(rng.choice(train_eps, size=min(k, len(train_eps)), replace=False).tolist())
        sub = DsreNpz(
            schema_vec=data.schema_vec,
            span_vec=data.span_vec,
            layout=data.layout,
            offsets=data.offsets,
            gold=data.gold,
            split=np.array(
                [SPLIT_TRAIN if i in chosen else 99 for i in range(len(data.gold))], dtype=np.int8
            ),
            family=data.family,
            field_type=data.field_type,
            field_key=data.field_key,
            field_absent=data.field_absent,
            doc_id=data.doc_id,
            candidate_text=data.candidate_text,
            episode_doc=data.episode_doc,
        )
        # Hack: mark non-chosen train as split 99 excluded from train_head
        weights = train_head(sub, kind)
        tp = fp = fn = 0
        for ep in range(len(data.gold)):
            if int(data.split[ep]) != SPLIT_TEST or data.field_absent[ep]:
                continue
            _, pred_idx = score_episode(data, ep, kind, weights)
            gold = int(data.gold[ep])
            if gold >= 0 and pred_idx == gold:
                tp += 1
            else:
                fp += 1
                fn += 1
        prec = tp / (tp + fp) if (tp + fp) else 0.0
        rec = tp / (tp + fn) if (tp + fn) else 0.0
        f1 = 2 * prec * rec / (prec + rec) if (prec + rec) else 0.0
        out.append({"train_fraction": frac, "micro_f1": f1})
    return out


def error_samples(data: DsreNpz, kind: HeadKind, weights, schema_keys: list[str], limit: int = 15) -> list[dict]:
    samples: list[dict] = []
    for ep in range(len(data.gold)):
        if int(data.split[ep]) != SPLIT_TEST or data.field_absent[ep]:
            continue
        score, pred_idx = score_episode(data, ep, kind, weights)
        gold_idx = int(data.gold[ep])
        if gold_idx >= 0 and pred_idx == gold_idx:
            continue
        pred_text = data.candidate_text[pred_idx] if pred_idx >= 0 else ""
        gold_text = data.candidate_text[gold_idx] if gold_idx >= 0 else ""
        samples.append(
            {
                "doc_id": str(data.doc_id[ep]),
                "field": schema_keys[int(data.field_key[ep])],
                "pred": str(pred_text),
                "gold": str(gold_text),
                "score": score,
            }
        )
        if len(samples) >= limit:
            break
    return samples


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", choices=("cord", "sroie"), required=True)
    parser.add_argument("--npz", type=Path, required=True)
    parser.add_argument("--results-dir", type=Path, default=ROOT / "results")
    args = parser.parse_args()

    schema_keys = [k for k, _, _ in (CORD_SCHEMA if args.dataset == "cord" else SROIE_SCHEMA)]
    data = DsreNpz.load(args.npz)
    results: dict[str, object] = {
        "dataset": args.dataset,
        "candidate_recall": candidate_recall(data),
        "heads": [],
    }

    t0 = time.perf_counter()
    curves_dir = args.results_dir / args.dataset
    pc_cache = None
    rel_weights = None
    for kind in (HeadKind.COSINE, HeadKind.LINEAR, HeadKind.BILINEAR, HeadKind.RELATIONAL):
        head_result = evaluate_head(data, kind)
        weights = train_head(data, kind)
        if kind == HeadKind.RELATIONAL:
            rel_weights = weights
            pc_cache = episode_score_cache(data, kind, weights)
            results["learning_curve"] = learning_curve(data, kind)
            results["errors"] = error_samples(data, kind, weights, schema_keys)
        results["heads"].append(head_result)
    if pc_cache is not None:
        precision_coverage_curve(
            data,
            pc_cache,
            curves_dir / "pc_relational.csv",
            curves_dir / "pc_relational.png",
        )
        weights = train_head(data, HeadKind.COSINE)
        cos_cache = episode_score_cache(data, HeadKind.COSINE, weights)
        precision_coverage_curve(
            data,
            cos_cache,
            curves_dir / "pc_cosine.csv",
            curves_dir / "pc_cosine.png",
        )

    results["gliner2"] = gliner_eval(data, schema_keys)
    results["elapsed_seconds"] = time.perf_counter() - t0

    args.results_dir.mkdir(parents=True, exist_ok=True)
    out = args.results_dir / f"{args.dataset}_dsre_results.json"
    out.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(results, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
