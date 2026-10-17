#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Train vendor line ranker + confidence gate on holdout calibration split."""

from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path

import numpy as np
from sklearn.linear_model import LogisticRegression

from docuvate_worker.infrastructure.ml.value_types.field_suggestions import (
    _has_sender_evidence,
    _is_heading_like,
    _is_invoice_banner,
    _split_label_value,
)
from docuvate_worker.infrastructure.ml.value_types.registry import get_value_type_models
from docuvate_worker.infrastructure.ml.value_types.sender_line_e5 import sender_lines_e5_cosine
from docuvate_worker.infrastructure.ml.value_types.field_confidence_calibration import (
    get_field_confidence_calibration,
)
from docuvate_worker.infrastructure.ml.value_types.field_suggestions import learned_field_suggestions
from docuvate_worker.infrastructure.ml.value_types.vendor_line_ranker import (
    VendorLineFeatures,
    VendorLineRanker,
    build_line_features,
    get_vendor_line_ranker,
)

REPO_ROOT = Path(__file__).resolve().parents[3]
HOLDOUT_PATH = REPO_ROOT / "apps/worker/tests/fixtures/global_field_holdout.v1.json"
RANKER_PATH = (
    REPO_ROOT
    / "apps/worker/src/docuvate_worker/infrastructure/ml/artifacts/vendor-line-ranker.v1.json"
)
CONFIDENCE_PATHS = (
    REPO_ROOT
    / "apps/worker/src/docuvate_worker/infrastructure/ml/artifacts/value-types-field-confidence.v1.json",
    REPO_ROOT
    / "apps/api/src/modules/documents/domain/artifacts/value-types-field-confidence.v1.json",
)


def _iter_candidates(text: str, bundle) -> list[tuple[str, int, bool, float, VendorLineFeatures]]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    sender_cosines = sender_lines_e5_cosine(lines)
    first_label_line_index: int | None = None
    for index, line in enumerate(lines):
        if _split_label_value(line)[1] is not None:
            first_label_line_index = index
            break
    rows: list[tuple[str, int, bool, float, VendorLineFeatures]] = []
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
        if money_score >= org_score:
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
        rows.append((candidate[:120], index, had_label, sender_cosines[index], features))
    return rows


def _training_rows(docs: list[dict[str, object]], bundle) -> tuple[np.ndarray, np.ndarray]:
    xs: list[list[float]] = []
    ys: list[int] = []
    for doc in docs:
        expected_raw = doc.get("expected")
        expected = expected_raw if isinstance(expected_raw, dict) else {}
        vendor_gt = expected.get("vendor")
        text = str(doc.get("text", ""))
        for candidate, _, _, _, features in _iter_candidates(text, bundle):
            label = 1 if isinstance(vendor_gt, str) and candidate == vendor_gt else 0
            xs.append(features.as_vector())
            ys.append(label)
    return np.asarray(xs, dtype=np.float64), np.asarray(ys, dtype=np.int64)


def main() -> None:
    bundle = get_value_type_models()
    holdout = json.loads(HOLDOUT_PATH.read_text(encoding="utf-8"))
    cal_docs = [doc for doc in holdout["documents"] if doc.get("split") == "calibration"]
    x_train, y_train = _training_rows(cal_docs, bundle)
    if x_train.size == 0:
        raise SystemExit("No training rows")

    model = LogisticRegression(max_iter=500, class_weight="balanced")
    model.fit(x_train, y_train)

    def slot_vendor_metrics(docs: list[dict[str, object]]) -> tuple[float, float]:
        tp = fp = fn = 0
        for doc in docs:
            expected_raw = doc.get("expected")
            expected = expected_raw if isinstance(expected_raw, dict) else {}
            predicted = {f.key: f.value for f in learned_field_suggestions(str(doc.get("text", "")))}
            if "vendor" in expected:
                if predicted.get("vendor") == expected["vendor"]:
                    tp += 1
                else:
                    fn += 1
                    if "vendor" in predicted:
                        fp += 1
            elif "vendor" in predicted:
                fp += 1
        precision = 1.0 if tp + fp == 0 else tp / (tp + fp)
        recall = 1.0 if tp + fn == 0 else tp / (tp + fn)
        return precision, recall

    best_threshold = 0.5
    best_recall = -1.0
    for threshold in np.linspace(0.05, 0.95, 37):
        ranker_payload_probe = {
            "version": "1",
            "feature_names": [
                "sender_e5_cosine",
                "org_minus_free",
                "org_minus_alt",
                "money_minus_org",
                "label_hint",
                "line_position_ratio",
            ],
            "coefficients": [float(value) for value in model.coef_[0]],
            "intercept": float(model.intercept_[0]),
            "min_score": float(threshold),
        }
        RANKER_PATH.write_text(json.dumps(ranker_payload_probe, indent=2) + "\n", encoding="utf-8")
        get_vendor_line_ranker.cache_clear()
        precision, recall = slot_vendor_metrics(cal_docs)
        if precision + 1e-9 >= 0.91 and recall > best_recall:
            best_recall = recall
            best_threshold = float(threshold)

    ranker_payload = {
        "version": "1",
        "feature_names": [
            "sender_e5_cosine",
            "org_minus_free",
            "org_minus_alt",
            "money_minus_org",
            "label_hint",
            "line_position_ratio",
        ],
        "coefficients": [float(value) for value in model.coef_[0]],
        "intercept": float(model.intercept_[0]),
        "min_score": min(best_threshold, 0.41),
    }
    RANKER_PATH.parent.mkdir(parents=True, exist_ok=True)
    RANKER_PATH.write_text(json.dumps(ranker_payload, indent=2) + "\n", encoding="utf-8")
    get_vendor_line_ranker.cache_clear()

    confidence = json.loads(CONFIDENCE_PATHS[0].read_text(encoding="utf-8"))
    best_conf = 0.62
    best_conf_recall = -1.0
    for conf in np.linspace(0.52, 0.72, 11):
        confidence["vendor_gate"]["min_calibrated_confidence"] = round(float(conf), 4)
        confidence["auto_promote_min_by_field"]["vendor"] = round(float(conf), 4)
        text = json.dumps(confidence, indent=2) + "\n"
        for path in CONFIDENCE_PATHS:
            path.write_text(text, encoding="utf-8")
        get_field_confidence_calibration.cache_clear()
        precision, recall = slot_vendor_metrics(cal_docs)
        if precision + 1e-9 >= 0.91 and recall > best_conf_recall:
            best_conf_recall = recall
            best_conf = float(conf)
    confidence["vendor_gate"]["min_calibrated_confidence"] = round(best_conf, 4)
    confidence["auto_promote_min_by_field"]["vendor"] = round(best_conf, 4)
    text = json.dumps(confidence, indent=2) + "\n"
    for path in CONFIDENCE_PATHS:
        path.write_text(text, encoding="utf-8")
    get_field_confidence_calibration.cache_clear()
    cal_precision, cal_recall = slot_vendor_metrics(cal_docs)

    print(
        json.dumps(
            {
                "ranker": ranker_payload,
                "train_pos_rate": float(y_train.mean()),
                "calibration_vendor_precision": cal_precision,
                "calibration_vendor_recall": cal_recall,
                "vendor_min_confidence": best_conf,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
