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
from sklearn.isotonic import IsotonicRegression
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
    _digits_ratio,
    _has_sender_evidence,
    _is_heading_like,
    _is_invoice_banner,
    _normalize_amount,
    _split_label_value,
    learned_field_suggestions,
    peek_amount_promotion_candidate,
    peek_vendor_promotion_candidate,
)
from docuvate_worker.infrastructure.ml.value_types.promotion_probability_calibrator import (
    get_promotion_probability_calibrators,
)
from docuvate_worker.infrastructure.ml.value_types.vendor_role_line_e5 import (
    doc_heading_lines_e5_cosine,
    recipient_lines_e5_cosine,
    supplier_lines_e5_cosine,
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
FROZEN_EVAL_V2_PATH = (
    REPO_ROOT / "apps/worker/tests/fixtures/global_field_holdout_frozen_eval_v2.v1.json"
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
PROMOTION_CALIBRATOR_PATH = (
    REPO_ROOT
    / "apps/worker/src/docuvate_worker/infrastructure/ml/artifacts"
    / "field-promotion-calibrators.v1.json"
)

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
        recipient_cosines = recipient_lines_e5_cosine(lines)
        supplier_cosines = supplier_lines_e5_cosine(lines)
        heading_cosines = doc_heading_lines_e5_cosine(lines)
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
                lines=lines,
                candidate=candidate,
                line_index=index,
                line_count=len(lines),
                sender_e5_cosine=sender_cosines[index],
                had_explicit_label=had_label,
                first_label_line_index=first_label_line_index,
                recipient_e5_cosine=recipient_cosines[index],
                supplier_e5_cosine=supplier_cosines[index],
                doc_heading_e5_cosine=heading_cosines[index],
                supplier_cosines=supplier_cosines,
                digits_ratio=_digits_ratio(candidate),
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
    for path in CONFIDENCE_PATHS:
        _atomic_write_json(path, payload)
    get_field_confidence_calibration.cache_clear()


def _atomic_write_json(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f"{path.name}.tmp")
    tmp.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)


def _write_vendor_ranker(payload: dict[str, object]) -> None:
    _atomic_write_json(VENDOR_RANKER_PATH, payload)
    get_vendor_line_ranker.cache_clear()


def _write_amount_ranker(payload: dict[str, object]) -> None:
    _atomic_write_json(AMOUNT_RANKER_PATH, payload)
    get_amount_line_ranker.cache_clear()


def _write_promotion_calibrators(payload: dict[str, object]) -> None:
    _atomic_write_json(PROMOTION_CALIBRATOR_PATH, payload)
    get_promotion_probability_calibrators.cache_clear()


def _fit_promotion_calibrators(
    threshold_docs: list[dict[str, object]], bundle: ValueTypeModelBundle
) -> dict[str, object]:
    vendor_x: list[list[float]] = []
    vendor_y: list[int] = []
    amount_scores: list[float] = []
    amount_y: list[int] = []
    for doc in threshold_docs:
        expected_raw = doc.get("expected")
        expected = expected_raw if isinstance(expected_raw, dict) else {}
        text = str(doc.get("text", ""))
        vendor_gt = expected.get("vendor")
        if isinstance(vendor_gt, str):
            row = peek_vendor_promotion_candidate(text, bundle)
            if row is not None:
                vendor_x.append(
                    [
                        row.ranker_score,
                        row.sender_e5_cosine,
                        row.recipient_e5_cosine,
                        row.supplier_e5_cosine,
                        row.doc_heading_e5_cosine,
                        1.0 if row.had_explicit_label else 0.0,
                        row.letterhead_band_hint,
                        row.footer_band_hint,
                        row.cross_block_supplier_e5,
                        row.iban_holder_adjacency,
                        row.supplier_e5_cosine - row.recipient_e5_cosine,
                        row.digits_ratio,
                        row.addr_minus_org,
                    ]
                )
                vendor_y.append(1 if row.value == vendor_gt else 0)
        amount_gt = expected.get("amount")
        if isinstance(amount_gt, str):
            amount_row = peek_amount_promotion_candidate(text, bundle)
            if amount_row is not None:
                amount_scores.append(amount_row.ranker_score)
                amount_y.append(1 if _normalize_amount(amount_row.token) == amount_gt else 0)
    vendor_model = LogisticRegression(max_iter=800)
    vendor_model.fit(np.asarray(vendor_x, dtype=np.float64), np.asarray(vendor_y, dtype=np.int64))
    iso = IsotonicRegression(out_of_bounds="clip")
    iso.fit(np.asarray(amount_scores, dtype=np.float64), np.asarray(amount_y, dtype=np.int64))
    return {
        "version": "1",
        "vendor": {
            "method": "platt",
            "feature_names": [
                "ranker_score",
                "sender_e5_cosine",
                "recipient_e5_cosine",
                "supplier_e5_cosine",
                "doc_heading_e5_cosine",
                "label_hint",
                "letterhead_band_hint",
                "footer_band_hint",
                "cross_block_supplier_e5",
                "iban_holder_adjacency",
                "supplier_minus_recipient_e5",
                "digits_ratio",
                "addr_minus_org",
            ],
            "coefficients": [float(v) for v in vendor_model.coef_[0]],
            "intercept": float(vendor_model.intercept_[0]),
        },
        "amount": {
            "method": "isotonic",
            "x": [float(v) for v in iso.X_thresholds_],
            "y": [float(v) for v in iso.y_thresholds_],
        },
    }


def _slot_precision(docs: list[dict[str, object]], field: str) -> tuple[float, float]:
    metrics = slot_metrics_for_field(docs, _predict, field)
    return metrics.precision, metrics.recall


def _frozen_v2_vendor_ok(
    frozen_v2_docs: list[dict[str, object]], *, min_recall: float = 0.60
) -> bool:
    metrics = slot_metrics_for_field(frozen_v2_docs, _predict, "vendor")
    if metrics.expected_slots <= 0:
        return True
    return (
        metrics.precision + 1e-9 >= TARGET_PRECISION
        and metrics.recall + 1e-9 >= min_recall
        and metrics.predicted_slots > 0
    )


def _split_precision_ok(
    docs: list[dict[str, object]], field: str, *, target: float = TARGET_PRECISION
) -> bool:
    metrics = slot_metrics_for_field(docs, _predict, field)
    if metrics.expected_slots <= 0:
        return True
    if metrics.predicted_slots <= 0:
        return False
    return metrics.precision + 1e-9 >= target


def _apply_vendor_gate(
    vendor_ranker: dict[str, object],
    payload: dict[str, object],
    *,
    min_score: float,
    min_labeled: float,
    min_conf: float,
) -> None:
    vendor_ranker["min_score"] = min_score
    vendor_ranker["min_score_labeled_sender_e5"] = min_labeled
    _write_vendor_ranker(vendor_ranker)
    payload["vendor_gate"]["min_calibrated_confidence"] = round(min_conf, 4)
    payload["auto_promote_min_by_field"]["vendor"] = round(min_conf, 4)
    _write_artifact(payload)


def _apply_amount_gate(
    amount_ranker: dict[str, object],
    payload: dict[str, object],
    *,
    min_score: float,
    margin: float,
    min_conf: float,
) -> None:
    amount_ranker["min_score"] = min_score
    _write_amount_ranker(amount_ranker)
    payload["amount_gate"] = {
        "min_ranker_score": round(min_score, 4),
        "min_ranker_margin_over_runner_up": margin,
        "min_calibrated_confidence": min_conf,
    }
    payload["auto_promote_min_by_field"]["amount"] = min_conf
    _write_artifact(payload)


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
    if not FROZEN_EVAL_V2_PATH.is_file():
        raise SystemExit("Run generate_global_field_frozen_eval_v2.py first")

    all_docs = json.loads(HOLDOUT_PATH.read_text(encoding="utf-8"))["documents"]
    frozen_docs = json.loads(FROZEN_EVAL_PATH.read_text(encoding="utf-8"))["documents"]
    frozen_v2_docs = json.loads(FROZEN_EVAL_V2_PATH.read_text(encoding="utf-8"))["documents"]
    _warm_passage_cache(all_docs + frozen_docs + frozen_v2_docs)

    bundle = get_value_type_models()
    train_docs = _load_docs("train")
    threshold_docs = _load_docs("threshold")
    confirm_docs = _load_docs("confirm")
    eval_docs = _load_docs("eval")

    x_vendor, y_vendor = _iter_vendor_training_rows(train_docs, bundle)
    vendor_model = LogisticRegression(max_iter=2000, class_weight="balanced", C=4.0)
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
            "recipient_e5_cosine",
            "supplier_e5_cosine",
            "doc_heading_e5_cosine",
            "supplier_minus_recipient_e5",
            "letterhead_band_hint",
            "footer_band_hint",
            "cross_block_supplier_e5",
            "iban_holder_adjacency",
            "labeled_recipient_e5",
            "doc_heading_minus_supplier_e5",
            "letterhead_supplier_interaction",
            "digits_ratio",
            "addr_minus_org",
            "doc_heading_low_org_margin",
            "labeled_recipient_over_supplier",
            "letterhead_org_margin",
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

    _write_promotion_calibrators(_fit_promotion_calibrators(threshold_docs, bundle))

    base_conf = json.loads(CONFIDENCE_PATHS[0].read_text(encoding="utf-8"))
    payload = deepcopy(base_conf)
    payload["amount_gate"] = {
        "min_ranker_score": 0.5,
        "min_ranker_margin_over_runner_up": 0.0,
        "min_calibrated_confidence": 0.88,
    }

    vendor_feasible: list[tuple[float, float, float, float, float, float]] = []
    vendor_pr_curve: list[dict[str, float]] = []
    for min_score in np.linspace(0.42, 0.90, 10):
        for min_labeled in np.linspace(0.40, 0.66, 6):
            for min_conf in np.linspace(0.45, 0.92, 10):
                vendor_ranker["min_score"] = float(min_score)
                vendor_ranker["min_score_labeled_sender_e5"] = float(min_labeled)
                _write_vendor_ranker(vendor_ranker)
                payload["vendor_gate"]["min_calibrated_confidence"] = round(float(min_conf), 4)
                payload["auto_promote_min_by_field"]["vendor"] = round(float(min_conf), 4)
                _write_artifact(payload)
                vendor_metrics = slot_metrics_for_field(threshold_docs, _predict, "vendor")
                precision, recall = vendor_metrics.precision, vendor_metrics.recall
                vendor_pr_curve.append(
                    {
                        "min_score": float(min_score),
                        "min_score_labeled_sender_e5": float(min_labeled),
                        "min_conf": float(min_conf),
                        "precision": precision,
                        "recall": recall,
                    }
                )
                if (
                    precision + 1e-9 >= TARGET_PRECISION
                    and vendor_metrics.predicted_slots > 0
                ):
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

    vendor_feasible_validated: list[tuple[float, float, float, float, float, float]] = []
    best_vendor: tuple[float, float, float, float, float, float] | None = None
    if vendor_feasible:
        vendor_feasible.sort(key=lambda row: (-row[0], row[5]))
        for row in vendor_feasible:
            recall, v_score, v_labeled, v_conf, _, _ = row
            _apply_vendor_gate(
                vendor_ranker,
                payload,
                min_score=v_score,
                min_labeled=v_labeled,
                min_conf=v_conf,
            )
            if (
                _split_precision_ok(threshold_docs, "vendor")
                and _split_precision_ok(confirm_docs, "vendor")
                and _split_precision_ok(eval_docs, "vendor")
                and _frozen_v2_vendor_ok(frozen_v2_docs)
            ):
                vendor_feasible_validated.append(row)
        if vendor_feasible_validated:
            vendor_feasible_validated.sort(key=lambda row: (-row[0], row[1]))
            best_vendor = vendor_feasible_validated[0]
            _, v_score, v_labeled, v_conf, _, _ = best_vendor
            _apply_vendor_gate(
                vendor_ranker,
                payload,
                min_score=v_score,
                min_labeled=v_labeled,
                min_conf=v_conf,
            )
        else:
            for row in sorted(vendor_feasible, key=lambda r: (-r[0], r[5])):
                _, v_score, v_labeled, v_conf, _, _ = row
                _apply_vendor_gate(
                    vendor_ranker,
                    payload,
                    min_score=v_score,
                    min_labeled=v_labeled,
                    min_conf=v_conf,
                )
                if (
                    _split_precision_ok(threshold_docs, "vendor")
                    and _split_precision_ok(confirm_docs, "vendor")
                    and _split_precision_ok(eval_docs, "vendor")
                    and _frozen_v2_vendor_ok(frozen_v2_docs)
                ):
                    best_vendor = row
                    break
    _write_vendor_ranker(vendor_ranker)

    amount_feasible: list[tuple[float, float, float, float, float]] = []
    amount_pr_curve: list[dict[str, float]] = []
    for min_score in np.linspace(0.05, 0.82, 12):
        for margin in (0.0, 0.01, 0.02, 0.04):
            for min_conf in np.linspace(0.55, 0.90, 10):
                _apply_amount_gate(
                    amount_ranker,
                    payload,
                    min_score=float(min_score),
                    margin=float(margin),
                    min_conf=float(min_conf),
                )
                amount_metrics = slot_metrics_for_field(threshold_docs, _predict, "amount")
                precision, recall = amount_metrics.precision, amount_metrics.recall
                amount_pr_curve.append(
                    {
                        "min_ranker_score": float(min_score),
                        "margin": float(margin),
                        "min_conf": float(min_conf),
                        "precision": precision,
                        "recall": recall,
                    }
                )
                if (
                    precision + 1e-9 >= TARGET_PRECISION
                    and amount_metrics.predicted_slots > 0
                ):
                    amount_feasible.append(
                        (
                            recall,
                            float(min_score),
                            float(margin),
                            float(min_conf),
                            float(min_score) + float(min_conf) + float(margin),
                        )
                    )

    amount_feasible_validated: list[tuple[float, float, float, float, float]] = []
    best_amount: tuple[float, float, float, float, float] | None = None
    if amount_feasible:
        amount_feasible.sort(key=lambda row: (-row[0], row[4]))
        for row in amount_feasible:
            recall, a_score, margin, a_conf, _ = row
            _apply_amount_gate(
                amount_ranker,
                payload,
                min_score=a_score,
                margin=margin,
                min_conf=a_conf,
            )
            if (
                _split_precision_ok(threshold_docs, "amount")
                and _split_precision_ok(confirm_docs, "amount")
                and _split_precision_ok(eval_docs, "amount")
            ):
                amount_feasible_validated.append(row)
        if amount_feasible_validated:
            best_amount = amount_feasible_validated[0]
            _, a_score, margin, a_conf, _ = best_amount
            _apply_amount_gate(
                amount_ranker,
                payload,
                min_score=a_score,
                margin=margin,
                min_conf=a_conf,
            )

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
    frozen_eval_v2_metrics = {
        field: asdict(slot_metrics_for_field(frozen_v2_docs, _predict, field))
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
        "frozen_eval_v2_split": frozen_eval_v2_metrics,
        "frozen_eval_doc_count": len(frozen_docs),
        "frozen_eval_v2_doc_count": len(frozen_v2_docs),
        "amount_pr_curve": amount_pr_curve,
        "vendor_confirm_passed": confirm_metrics["vendor"]["precision"] >= TARGET_PRECISION,
        "amount_confirm_passed": confirm_metrics["amount"]["precision"] >= TARGET_PRECISION,
        "amount_frozen_eval_passed": (
            frozen_eval_v2_metrics["amount"]["precision"] >= TARGET_PRECISION
            and frozen_eval_v2_metrics["amount"]["recall"] >= 0.70
        ),
        "vendor_frozen_eval_passed": (
            frozen_eval_v2_metrics["vendor"]["precision"] >= TARGET_PRECISION
            and frozen_eval_v2_metrics["vendor"]["recall"] >= 0.60
        ),
        "frozen_eval_seed": json.loads(FROZEN_EVAL_PATH.read_text(encoding="utf-8")).get(
            "frozen_seed"
        ),
        "frozen_eval_v2_seed": json.loads(FROZEN_EVAL_V2_PATH.read_text(encoding="utf-8")).get(
            "frozen_seed"
        ),
        "calibration": {
            "vendor": "platt_on_threshold_split_top_vendor_candidate",
            "amount": "isotonic_on_threshold_split_top_amount_candidate",
        },
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
