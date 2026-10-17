#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Few-shot curves: DSRE field head + synthetic hybrid-label proxy (E5+TF-IDF+LR)."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = Path(__file__).resolve().parents[3]
DSRE = WORKSPACE / "research" / "extraction_baseline" / "dsre"
RESULTS = ROOT / "results"


def run_dsre_learning(dataset: str) -> dict[str, object]:
    npz = DSRE / "data" / f"{dataset}.npz"
    if not npz.exists():
        subprocess.run(
            [
                sys.executable,
                str(DSRE / "scripts" / "build_npz.py"),
                "--dataset",
                dataset,
                "--out",
                str(npz),
            ],
            check=True,
            cwd=str(DSRE),
        )
    import os

    env = os.environ.copy()
    env["PYTHONPATH"] = str(DSRE)
    cmd = [
        sys.executable,
        str(DSRE / "scripts" / "run_dsre_benchmark.py"),
        "--dataset",
        dataset,
        "--npz",
        str(npz),
        "--results-dir",
        str(RESULTS / "dsre_few_shot"),
    ]
    subprocess.run(cmd, check=True, cwd=str(DSRE), env=env)
    produced = RESULTS / "dsre_few_shot" / f"{dataset}_dsre_results.json"
    payload = json.loads(produced.read_text(encoding="utf-8"))
    return summarize_dsre(payload)


def summarize_dsre(payload: dict[str, object]) -> dict[str, object]:
    """Extract learning curve + relational head F1; note incremental vs full in DSRE."""
    heads = payload.get("heads") or []
    rel = next((h for h in heads if h.get("kind") == "relational" or h.get("head") == "relational"), None)
    return {
        "dataset": payload.get("dataset"),
        "candidate_recall": payload.get("candidate_recall"),
        "relational_head_test": rel,
        "learning_curve_full_retrain": payload.get("learning_curve"),
        "gliner2_episode_baseline": payload.get("gliner2"),
        "elapsed_seconds": payload.get("elapsed_seconds"),
        "incremental_vs_full_note": (
            "DSRE train_head retrains from scratch at each train_fraction (full retrain). "
            "No warm-start incremental path in dsre_lib; regression on old types approximated "
            "by comparing micro-F1 at 1.0 fraction vs lower fractions on same test split."
        ),
    }


def run_label_proxy_curve() -> dict[str, object]:
    """Synthetic licence-clean texts — NOT public benchmark."""
    import numpy as np
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score
    from sklearn.preprocessing import normalize

    fixture = WORKSPACE / "bench" / "model_gates" / "fixtures" / "classification_texts.json"
    payload = json.loads(fixture.read_text(encoding="utf-8"))
    texts: list[str] = []
    labels: list[str] = []
    for row in payload.get("examples", []):
        texts.append(str(row.get("text", "")))
        labels.append(str(row.get("label_id", "")))

    sys.path.insert(0, str(WORKSPACE / "research" / "extraction_baseline" / "dsre"))
    from dsre_lib.e5_encode import embed_passages

    e5 = embed_passages(texts)
    e5 = normalize(e5, norm="l2", axis=1)
    tfidf = TfidfVectorizer(max_features=512, ngram_range=(1, 2))
    x_full = np.hstack([tfidf.fit_transform(texts).toarray(), 1.25 * e5])

    shots = [2, 4, 8, 16, 32]
    rng = np.random.default_rng(11)
    label_ids = sorted(set(labels))
    full_retrain: list[dict[str, float | int]] = []
    incremental: list[dict[str, float | int]] = []
    cumulative_train: list[int] = []

    for shot in shots:
        test_indices: list[int] = []
        train_indices: list[int] = []
        for label in label_ids:
            idx = [i for i, label_i in enumerate(labels) if label_i == label]
            if len(idx) <= shot:
                continue
            test_indices.append(idx[-1])
            chosen = rng.choice(idx[:-1], size=min(shot, len(idx) - 1), replace=False)
            train_indices.extend(chosen.tolist())

        if len(train_indices) < 10 or len(test_indices) < 2:
            full_retrain.append(
                {"shots_per_class": shot, "holdout_accuracy": 0.0, "holdout_n": len(test_indices)}
            )
            incremental.append(
                {"shots_per_class": shot, "holdout_accuracy": 0.0, "holdout_n": len(test_indices)}
            )
            continue

        clf_full = LogisticRegression(max_iter=600)
        clf_full.fit(x_full[train_indices], np.array(labels)[train_indices])
        pred_full = clf_full.predict(x_full[test_indices])
        acc_full = accuracy_score(np.array(labels)[test_indices], pred_full)
        full_retrain.append(
            {
                "shots_per_class": shot,
                "holdout_accuracy": float(acc_full),
                "holdout_n": len(test_indices),
            }
        )

        cumulative_train = sorted(set(cumulative_train) | set(train_indices))
        clf_inc = LogisticRegression(max_iter=600)
        clf_inc.fit(x_full[cumulative_train], np.array(labels)[cumulative_train])
        pred_inc = clf_inc.predict(x_full[test_indices])
        acc_inc = accuracy_score(np.array(labels)[test_indices], pred_inc)
        incremental.append(
            {
                "shots_per_class": shot,
                "holdout_accuracy": float(acc_inc),
                "holdout_n": len(test_indices),
                "cumulative_train_n": len(cumulative_train),
            }
        )

    old_types = label_ids[:4]
    new_types = label_ids[4:]
    regression: dict[str, object] = {}
    if new_types:
        old_idx = [i for i, label_i in enumerate(labels) if label_i in old_types]
        new_idx = [i for i, label_i in enumerate(labels) if label_i in new_types]
        if len(old_idx) > 50 and len(new_idx) > 50:
            base_train = old_idx[: int(0.7 * len(old_idx))]
            base_test = old_idx[int(0.7 * len(old_idx)) :]
            clf_base = LogisticRegression(max_iter=600)
            clf_base.fit(x_full[base_train], np.array(labels)[base_train])
            base_acc = accuracy_score(np.array(labels)[base_test], clf_base.predict(x_full[base_test]))
            mix_train = base_train + new_idx[: min(200, len(new_idx))]
            clf_mix = LogisticRegression(max_iter=600)
            clf_mix.fit(x_full[mix_train], np.array(labels)[mix_train])
            mix_acc = accuracy_score(np.array(labels)[base_test], clf_mix.predict(x_full[base_test]))
            regression = {
                "old_type_labels": old_types,
                "new_type_labels": new_types,
                "baseline_old_only_holdout_accuracy": float(base_acc),
                "after_adding_new_types_old_holdout_accuracy": float(mix_acc),
                "delta": float(mix_acc - base_acc),
            }

    return {
        "benchmark_kind": "synthetic_label_hybrid_proxy",
        "fixture": str(fixture),
        "note": "TF-IDF+E5+LR proxy; real hybrid uses same weights in label-hybrid-features.ts",
        "full_retrain_curve": full_retrain,
        "incremental_cumulative_curve": incremental,
        "new_type_regression_on_old_types": regression,
    }


def main() -> int:
    report: dict[str, object] = {
        "field_mapping_dsre": {},
        "label_hybrid_proxy": run_label_proxy_curve(),
    }
    for ds in ("sroie", "cord"):
        try:
            report["field_mapping_dsre"][ds] = run_dsre_learning(ds)
        except subprocess.CalledProcessError as exc:
            report["field_mapping_dsre"][ds] = {"error": str(exc)}
    RESULTS.mkdir(parents=True, exist_ok=True)
    out = RESULTS / "few_shot_learning_curves.json"
    out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
