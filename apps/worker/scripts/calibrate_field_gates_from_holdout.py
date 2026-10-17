#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Train rankers on train split; tune gates on threshold; confirm on confirm split."""

from __future__ import annotations

import json
import sys
from copy import deepcopy
from dataclasses import asdict
from pathlib import Path

import numpy as np
from sklearn.linear_model import LogisticRegression

REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT / "apps/worker/scripts") not in sys.path:
    sys.path.insert(0, str(REPO_ROOT / "apps/worker/scripts"))

# ruff: noqa: E402

from holdout_metrics import FIELD_KEYS, slot_metrics_for_field

from docuvate_worker.infrastructure.extractors.field_extraction_context import (
    clear_passage_vector_cache,
    register_passage_vectors,
)
from docuvate_worker.infrastructure.fastembed_model import embed_passages
from docuvate_worker.infrastructure.ml.value_types.amount_candidate_rows import (
    iter_amount_candidate_rows,
)
from docuvate_worker.infrastructure.ml.value_types.amount_line_ranker import (
    get_amount_line_ranker,
)
from docuvate_worker.infrastructure.ml.value_types.field_confidence_calibration import (
    get_field_confidence_calibration,
)
from docuvate_worker.infrastructure.ml.value_types.field_suggestions import (
    _has_sender_evidence,
    _is_heading_like,
    _is_invoice_banner,
    _normalize_amount,
    _split_label_value,
    learned_field_suggestions,
)
from docuvate_worker.infrastructure.ml.value_types.model import (
    ValueTypeModelBundle,
)
from docuvate_worker.infrastructure.ml.value_types.registry import (
    get_value_type_models,
)
from docuvate_worker.infrastructure.ml.value_types.sender_line_e5 import (
    sender_lines_e5_cosine,
)
from docuvate_worker.infrastructure.ml.value_types.vendor_line_ranker import (
    build_line_features,
    get_vendor_line_ranker,
)

HOLDOUT_PATH = REPO_ROOT / "apps/worker/tests/fixtures/global_field_holdout.v1.json"
FROZEN_EVAL_PATH = (
    REPO_ROOT / "apps/worker/tests/fixtures/global_field_holdout_frozen_eval.v1.json"
)
VENDOR_RANKER_PATH = (
    REPO_ROOT
    / "apps/worker/src/docuvate_worker/infrastructure/ml/artifacts/vendor-line-ranker.v1.json"
)
AMOUNT_RANKER_PATH = (
    REPO_ROOT
    / "apps/worker/src/docuvate_worker/infrastructure/ml/artifacts/amount-line-ranker.v1.json"
)
WORKER_CONFIDENCE = (
    REPO_ROOT
    / "apps/worker/src/docuvate_worker/infrastructure/ml/artifacts"
    / "value-types-field-confidence.v1.json"
)
API_CONFIDENCE = (
    REPO_ROOT
    / "apps/api/src/modules/documents/domain/artifacts"
    / "value-types-field-confidence.v1.json"
)
CONFIDENCE_PATHS = (WORKER_CONFIDENCE, API_CONFIDENCE)
REPORT_PATH = REPO_ROOT / "apps/worker/tests/fixtures/global_field_holdout_eval_report.v1.json"

TARGET_PRECISION = 0.95
RECALL_FLOOR_VS_BEST = 0.85


def _load_docs(split: str) -> list[dict[str, object]]:
    payload = json.loads(HOLDOUT_PATH.read_text(encoding="utf-8"))
    return [
        doc
        for doc in payload["documents"]
        if isinstance(doc, dict) and doc.get("split") == split
    ]


def _iter_vendor_training_rows(
    docs: list[dict[str, object]], bundle: ValueTypeModelBundle
) -> tuple[np.ndarray, np.ndarray]:
    xs: list[list[float]] = []
    ys: list[int] = []
    for doc in docs:
        expected_raw = doc.get("expected")
        expected = expected_raw if isinstance(expected_raw, dict) else {}
        vendor_gt = expected.get("vendor")
        vendor_gt_str = vendor_gt if isinstance(vendor_gt, str) else None
        text = str(doc.get("text", ""))
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        sender_cosines = sender_lines_e5_cosine(lines)
        first_label_line_index: int | None = None
        for index, line in enumerate(lines):
            if _split_label_value(line)[1] is not None:
                first_label_line_index = index
                break
        for index, line in enumerate(lines):
            _, value_part = _split_label_value(line)
            had_label = value_part is not None
            candidate = value_part if value_part is not None else line.strip()
            if not candidate or _is_heading_like(candidate, bundle):
                continue
            if not had_label and len(candidate.split()) >= 9:  # noqa: PLR2004
                continue
            if _is_invoice_banner(candidate):
                continue
            money_score = bundle.log_likelihood(candidate, "money")
            org_score = bundle.log_likelihood(candidate, "organization")
            if money_score >= org_score and not had_label:
                continue
            if not _has_sender_evidence(
                lines,
                index,
                candidate,
                bundle,
                had_explicit_label=had_label,
                sender_e5_cosine=sender_cosines[index],
            ):
                continue
            free_score = bundle.log_likelihood(candidate, "free_text")
            if org_score <= free_score:
                continue
            if org_score - free_score <= 0.5 and not had_label:  # noqa: PLR2004
                continue
            features = build_line_features(
                bundle=bundle,
                candidate=candidate,
                line_index=index,
                line_count=len(lines),
                sender_e5_cosine=sender_cosines[index],
                had_explicit_label=had_label,
                first_label_line_index=first_label_line_index,
            )
            label = (
                0
                if vendor_gt_str is None
                else 1
                if candidate == vendor_gt_str
                else 0
            )
            xs.append(features.as_vector())
            ys.append(label)
    return np.asarray(xs, dtype=np.float64), np.asarray(ys, dtype=np.int64)


def _iter_amount_training_rows(
    docs: list[dict[str, object]], bundle: ValueTypeModelBundle
) -> tuple[np.ndarray, np.ndarray]:
    xs: list[list[float]] = []
    ys: list[int] = []
    for doc in docs:
        expected_raw = doc.get("expected")
        expected = expected_raw if isinstance(expected_raw, dict) else {}
        amount_gt = expected.get("amount")
        amount_gt_norm = amount_gt if isinstance(amount_gt, str) else None
        text = str(doc.get("text", ""))
        for row in iter_amount_candidate_rows(text, bundle):
            if amount_gt_norm is None:
                label = 0
            else:
                label = 1 if _normalize_amount(row.token) == amount_gt_norm else 0
            xs.append(row.features.as_vector())
            ys.append(label)
    return np.asarray(xs, dtype=np.float64), np.asarray(ys, dtype=np.int64)


def _predict(text: str) -> dict[str, str]:
    return {field.key: field.value for field in learned_field_suggestions(text)}


def _write_artifact(payload: dict[str, object]) -> None:
    text = json.dumps(payload, indent=2) + "\n"
    for path in CONFIDENCE_PATHS:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
    get_field_confidence_calibration.cache_clear()


def _write_vendor_ranker(payload: dict[str, object]) -> None:
    VENDOR_RANKER_PATH.parent.mkdir(parents=True, exist_ok=True)
    VENDOR_RANKER_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    get_vendor_line_ranker.cache_clear()


def _write_amount_ranker(payload: dict[str, object]) -> None:
    AMOUNT_RANKER_PATH.parent.mkdir(parents=True, exist_ok=True)
    AMOUNT_RANKER_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    get_amount_line_ranker.cache_clear()


def _slot_precision(docs: list[dict[str, object]], field: str) -> tuple[float, float]:
    metrics = slot_metrics_for_field(docs, _predict, field)
    return metrics.precision, metrics.recall


def _amount_false_positive_samples(
    docs: list[dict[str, object]], *, limit: int = 12
) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for doc in docs:
        expected_raw = doc.get("expected")
        expected = expected_raw if isinstance(expected_raw, dict) else {}
        if "amount" not in expected:
            continue
        predicted = _predict(str(doc.get("text", "")))
        pred = predicted.get("amount")
        if pred is None:
            continue
        if pred != expected["amount"]:
            rows.append(
                {
                    "doc_id": str(doc.get("id", "")),
                    "expected": expected["amount"],
                    "predicted": pred,
                    "category": str(doc.get("category", "")),
                }
            )
        if len(rows) >= limit:
            break
    return rows


def _warm_passage_cache(docs: list[dict[str, object]]) -> None:
    clear_passage_vector_cache()
    lines: list[str] = []
    seen: set[str] = set()
    for doc in docs:
        for line in str(doc.get("text", "")).splitlines():
            stripped = line.strip()
            if stripped and stripped not in seen:
                seen.add(stripped)
                lines.append(stripped)
    if not lines:
        return
    vectors = embed_passages(lines)
    register_passage_vectors(
        {text: vector for text, vector in zip(lines, vectors, strict=True)}
    )


def main() -> None:
    if not HOLDOUT_PATH.is_file():
        raise SystemExit("Run generate_global_field_holdout.py first")
    if not FROZEN_EVAL_PATH.is_file():
        raise SystemExit("Run generate_global_field_frozen_eval.py first")

    all_docs = json.loads(HOLDOUT_PATH.read_text(encoding="utf-8"))["documents"]
    frozen_docs = json.loads(FROZEN_EVAL_PATH.read_text(encoding="utf-8"))["documents"]
    _warm_passage_cache(all_docs + frozen_docs)

    bundle = get_value_type_models()
    train_docs = _load_docs("train")
    threshold_docs = _load_docs("threshold")
    confirm_docs = _load_docs("confirm")
    eval_docs = _load_docs("eval")

    x_vendor, y_vendor = _iter_vendor_training_rows(train_docs, bundle)
    vendor_model = LogisticRegression(max_iter=800, class_weight="balanced")
    vendor_model.fit(x_vendor, y_vendor)
    vendor_ranker = {
        "version": "1",
        "feature_names": [
            "sender_e5_cosine",
            "org_minus_free",
            "org_minus_alt",
            "money_minus_org",
            "label_hint",
            "line_position_ratio",
            "top_of_page_hint",
            "first_label_line_offset",
        ],
        "coefficients": [float(v) for v in vendor_model.coef_[0]],
        "intercept": float(vendor_model.intercept_[0]),
        "min_score": 0.99,
        "min_score_labeled_sender_e5": 0.99,
    }
    _write_vendor_ranker(vendor_ranker)

    x_amount, y_amount = _iter_amount_training_rows(train_docs, bundle)
    amount_model = LogisticRegression(max_iter=1200, class_weight="balanced", C=1.8)
    amount_model.fit(x_amount, y_amount)
    amount_ranker = {
        "version": "1",
        "feature_names": [
            "money_score",
            "money_minus_identifier",
            "money_minus_date",
            "money_minus_address",
            "money_margin_over_non_money",
            "amount_label_e5_cosine",
            "vat_sum_consistency_hint",
            "label_hint",
            "bottom_line_ratio",
            "thousands_sep_hint",
            "token_length",
        ],
        "coefficients": [float(v) for v in amount_model.coef_[0]],
        "intercept": float(amount_model.intercept_[0]),
        "min_score": 0.99,
    }
    _write_amount_ranker(amount_ranker)

    base_conf = json.loads(CONFIDENCE_PATHS[0].read_text(encoding="utf-8"))
    payload = deepcopy(base_conf)
    payload["amount_gate"] = {
        "min_ranker_score": 0.5,
        "min_ranker_margin_over_runner_up": 0.0,
        "min_calibrated_confidence": 0.88,
    }

    vendor_feasible: list[tuple[float, float, float, float, float, float]] = []
    vendor_pr_curve: list[dict[str, float]] = []
    for min_score in np.linspace(0.55, 0.98, 16):
        for min_labeled in np.linspace(0.48, 0.72, 9):
            for min_conf in np.linspace(0.55, 0.92, 11):
                vendor_ranker["min_score"] = float(min_score)
                vendor_ranker["min_score_labeled_sender_e5"] = float(min_labeled)
                _write_vendor_ranker(vendor_ranker)
                payload["vendor_gate"]["min_calibrated_confidence"] = round(float(min_conf), 4)
                payload["auto_promote_min_by_field"]["vendor"] = round(float(min_conf), 4)
                _write_artifact(payload)
                precision, recall = _slot_precision(threshold_docs, "vendor")
                vendor_pr_curve.append(
                    {
                        "min_score": float(min_score),
                        "min_score_labeled_sender_e5": float(min_labeled),
                        "min_conf": float(min_conf),
                        "precision": precision,
                        "recall": recall,
                    }
                )
                if precision + 1e-9 >= TARGET_PRECISION:
                    strictness = float(min_score) + float(min_conf) - float(min_labeled) * 0.25
                    vendor_feasible.append(
                        (
                            recall,
                            float(min_score),
                            float(min_labeled),
                            float(min_conf),
                            precision,
                            strictness,
                        )
                    )

    best_vendor: tuple[float, float, float, float, float, float] | None = None
    if vendor_feasible:
        max_recall = max(row[0] for row in vendor_feasible)
        recall_cutoff = max_recall * RECALL_FLOOR_VS_BEST
        narrowed = [row for row in vendor_feasible if row[0] + 1e-9 >= recall_cutoff]
        best_vendor = max(narrowed, key=lambda row: (row[5], row[0]))

    if best_vendor is not None:
        _, v_score, v_labeled, v_conf, _, _ = best_vendor
        vendor_ranker["min_score"] = v_score
        vendor_ranker["min_score_labeled_sender_e5"] = v_labeled
        payload["vendor_gate"]["min_calibrated_confidence"] = round(v_conf, 4)
        payload["auto_promote_min_by_field"]["vendor"] = round(v_conf, 4)
    _write_vendor_ranker(vendor_ranker)

    amount_feasible: list[tuple[float, float, float, float, float]] = []
    amount_pr_curve: list[dict[str, float]] = []
    for min_score in np.linspace(0.05, 0.88, 16):
        for margin in (0.0, 0.01, 0.02, 0.04, 0.06):
            for min_conf in np.linspace(0.40, 0.92, 14):
                amount_ranker["min_score"] = float(min_score)
                _write_amount_ranker(amount_ranker)
                payload["amount_gate"] = {
                    "min_ranker_score": round(float(min_score), 4),
                    "min_ranker_margin_over_runner_up": float(margin),
                    "min_calibrated_confidence": float(min_conf),
                }
                payload["auto_promote_min_by_field"]["amount"] = float(min_conf)
                _write_artifact(payload)
                precision, recall = _slot_precision(threshold_docs, "amount")
                amount_pr_curve.append(
                    {
                        "min_ranker_score": float(min_score),
                        "margin": float(margin),
                        "min_conf": float(min_conf),
                        "precision": precision,
                        "recall": recall,
                    }
                )
                if precision + 1e-9 >= TARGET_PRECISION:
                    amount_feasible.append(
                        (
                            recall,
                            float(min_score),
                            float(margin),
                            float(min_conf),
                            float(min_score) + float(min_conf) + float(margin),
                        )
                    )

    best_amount: tuple[float, float, float, float, float] | None = None
    if amount_feasible:
        best_amount = max(amount_feasible, key=lambda row: (row[0], -row[4]))

    if best_amount is not None:
        _, a_score, margin, a_conf, _ = best_amount
        amount_ranker["min_score"] = a_score
        payload["amount_gate"] = {
            "min_ranker_score": round(a_score, 4),
            "min_ranker_margin_over_runner_up": margin,
            "min_calibrated_confidence": a_conf,
        }
        payload["auto_promote_min_by_field"]["amount"] = a_conf
    _write_amount_ranker(amount_ranker)
    _write_artifact(payload)

    confirm_metrics = {
        field: asdict(slot_metrics_for_field(confirm_docs, _predict, field))
        for field in FIELD_KEYS
    }
    eval_metrics = {
        field: asdict(slot_metrics_for_field(eval_docs, _predict, field))
        for field in FIELD_KEYS
    }
    frozen_eval_metrics = {
        field: asdict(slot_metrics_for_field(frozen_docs, _predict, field))
        for field in FIELD_KEYS
    }

    report = {
        "target_precision": TARGET_PRECISION,
        "holdout_doc_counts": {
            split: len(_load_docs(split)) for split in ("train", "threshold", "confirm", "eval")
        },
        "vendor_threshold_tuned": {
            "min_ranker_score": vendor_ranker["min_score"],
            "min_ranker_score_labeled_sender_e5": vendor_ranker.get(
                "min_score_labeled_sender_e5", vendor_ranker["min_score"]
            ),
            "min_calibrated_confidence": payload["vendor_gate"]["min_calibrated_confidence"],
            "threshold_split_precision": _slot_precision(threshold_docs, "vendor")[0],
            "threshold_split_recall": _slot_precision(threshold_docs, "vendor")[1],
        },
        "amount_threshold_tuned": {
            "min_ranker_score": amount_ranker["min_score"],
            **payload["amount_gate"],
            "threshold_split_precision": _slot_precision(threshold_docs, "amount")[0],
            "threshold_split_recall": _slot_precision(threshold_docs, "amount")[1],
        },
        "confirm_split": confirm_metrics,
        "eval_split": eval_metrics,
        "frozen_eval_split": frozen_eval_metrics,
        "frozen_eval_doc_count": len(frozen_docs),
        "amount_pr_curve": amount_pr_curve,
        "vendor_confirm_passed": confirm_metrics["vendor"]["precision"] >= TARGET_PRECISION,
        "amount_confirm_passed": confirm_metrics["amount"]["precision"] >= TARGET_PRECISION,
        "amount_frozen_eval_passed": (
            frozen_eval_metrics["amount"]["precision"] >= TARGET_PRECISION
            and frozen_eval_metrics["amount"]["recall"] >= 0.70
        ),
        "amount_false_positive_samples_threshold": _amount_false_positive_samples(threshold_docs),
        "vendor_pr_curve_sample": vendor_pr_curve[:: max(1, len(vendor_pr_curve) // 40)],
        "amount_pr_curve_sample": amount_pr_curve[:: max(1, len(amount_pr_curve) // 40)],
        "next_features_if_vendor_stuck": [
            "layout line bbox y-quantile (letterhead band) as ranker input",
            "address-block E5 adjacency score between candidate line and following lines",
            "top-page block cluster id from layout IR (learned embedding of block group)",
        ],
    }
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
