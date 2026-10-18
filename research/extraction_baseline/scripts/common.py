# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Shared helpers for extraction baseline benchmarks."""

from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

REPO_ROOT = Path(__file__).resolve().parents[3]
WORKER_SRC = REPO_ROOT / "apps" / "worker" / "src"
CACHE_DIR = REPO_ROOT / "research" / "extraction_baseline" / ".cache"
RESULTS_DIR = REPO_ROOT / "research" / "extraction_baseline" / "results"


def normalize_value(text: str) -> str:
    folded = unicodedata.normalize("NFKC", text or "")
    folded = folded.lower().strip()
    folded = re.sub(r"\s+", " ", folded)
    folded = re.sub(r"[,.\s]+$", "", folded)
    return folded


def flatten_gt_parse(obj: object, prefix: str = "") -> dict[str, str]:
    out: dict[str, str] = {}
    if isinstance(obj, dict):
        for key, value in obj.items():
            path = f"{prefix}.{key}" if prefix else str(key)
            out.update(flatten_gt_parse(value, path))
    elif isinstance(obj, list):
        for idx, item in enumerate(obj):
            path = f"{prefix}[{idx}]"
            out.update(flatten_gt_parse(item, path))
    elif obj is not None:
        text = str(obj).strip()
        if text:
            out[prefix] = text
    return out


def cord_canonical_key(field_path: str) -> str:
    """Map CORD gt_parse paths to a stable schema slug for matching."""
    lowered = field_path.lower()
    if lowered.endswith(".total_price") or lowered == "total.total_price":
        return "total_price"
    if ".price" in lowered and "menu" in lowered:
        return "item_price"
    if lowered.endswith(".nm") and "menu" in lowered:
        return "item_name"
    if lowered.endswith(".cnt") and "menu" in lowered:
        return "item_count"
    if "sub_total" in lowered and "price" in lowered:
        return "subtotal"
    if lowered.endswith(".tax_price") or ".tax" in lowered:
        return "tax"
    if lowered.endswith(".date"):
        return "date"
    if lowered.endswith(".nm") and "sub_total" not in lowered and "menu" not in lowered:
        return "store_name"
    slug = re.sub(r"[^a-z0-9]+", "_", lowered).strip("_")
    return slug or "field"


CORD_GLINER_ENTITY_TYPES: tuple[str, ...] = (
    "total_price",
    "subtotal",
    "tax",
    "cashprice",
    "changeprice",
    "date",
    "store_name",
    "phone",
    "address",
    "item_name",
    "item_price",
    "item_count",
)

SROIE_GLINER_ENTITY_TYPES: tuple[str, ...] = ("company", "date", "address", "total")


@dataclass(frozen=True)
class FieldPrediction:
    key: str
    value: str
    confidence: float | None = None


@dataclass(frozen=True)
class FieldExample:
    doc_id: str
    text: str
    ground_truth: dict[str, str]
    canonical_gt: dict[str, str]


def build_field_examples_cord(rows: Iterable[dict]) -> list[FieldExample]:
    examples: list[FieldExample] = []
    for idx, row in enumerate(rows):
        gt_raw = json.loads(row["ground_truth"])
        gt_flat = flatten_gt_parse(gt_raw.get("gt_parse", {}))
        canonical: dict[str, str] = {}
        for path, value in gt_flat.items():
            canonical[cord_canonical_key(path)] = value
        text_parts: list[str] = []
        for line in gt_raw.get("valid_line", []) or []:
            if not isinstance(line, dict):
                continue
            words = line.get("words") or []
            chunk = " ".join(
                str(w.get("text", "")).strip()
                for w in words
                if isinstance(w, dict) and w.get("text")
            ).strip()
            if chunk:
                text_parts.append(chunk)
        text = "\n".join(text_parts)
        examples.append(
            FieldExample(
                doc_id=f"cord-{idx}",
                text=text,
                ground_truth=gt_flat,
                canonical_gt=canonical,
            )
        )
    return examples


def build_field_examples_sroie(rows: Iterable[dict]) -> list[FieldExample]:
    examples: list[FieldExample] = []
    for idx, row in enumerate(rows):
        objects = row.get("objects") or {}
        entities = objects.get("entities") or {}
        if not isinstance(entities, dict):
            continue
        gt = {str(k): str(v) for k, v in entities.items() if v}
        texts = objects.get("text") or []
        if not isinstance(texts, list):
            texts = []
        text = "\n".join(str(t) for t in texts)
        examples.append(
            FieldExample(
                doc_id=f"sroie-{idx}",
                text=text,
                ground_truth=gt,
                canonical_gt=gt,
            )
        )
    return examples


def match_key(pred_key: str, gt_key: str) -> bool:
    p = pred_key.lower().replace("-", "_")
    g = gt_key.lower().replace("-", "_")
    if p == g:
        return True
    if p in g or g in p:
        return True
    return False


def score_field_level(
    predictions: list[FieldPrediction],
    canonical_gt: dict[str, str],
    *,
    abstain_threshold: float | None = None,
) -> dict[str, float | int]:
    """Micro precision/recall/F1 over canonical field keys."""
    tp = fp = fn = 0
    exact_docs = 0
    abstained = 0
    pred_by_key: dict[str, FieldPrediction] = {}
    for pred in predictions:
        if pred.confidence is not None and abstain_threshold is not None:
            if pred.confidence < abstain_threshold:
                abstained += 1
                continue
        pred_by_key.setdefault(pred.key, pred)

    all_correct = True
    for gt_key, gt_val in canonical_gt.items():
        gt_norm = normalize_value(gt_val)
        matched_pred: FieldPrediction | None = None
        for pk, pred in pred_by_key.items():
            if match_key(pk, gt_key):
                matched_pred = pred
                break
        if matched_pred is None:
            fn += 1
            all_correct = False
            continue
        if normalize_value(matched_pred.value) == gt_norm:
            tp += 1
        else:
            fp += 1
            fn += 1
            all_correct = False

    for pk, pred in pred_by_key.items():
        if any(match_key(pk, gk) for gk in canonical_gt):
            continue
        if pred.confidence is not None and abstain_threshold is not None:
            if pred.confidence < abstain_threshold:
                continue
        fp += 1

    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
    if all_correct and canonical_gt:
        exact_docs = 1
    return {
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "exact_doc": exact_docs,
        "abstained_preds": abstained,
    }


def aggregate_scores(per_doc: list[dict[str, float | int]]) -> dict[str, float]:
    tp = sum(int(d["tp"]) for d in per_doc)
    fp = sum(int(d["fp"]) for d in per_doc)
    fn = sum(int(d["fn"]) for d in per_doc)
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
    exact = sum(int(d["exact_doc"]) for d in per_doc)
    return {
        "micro_precision": precision,
        "micro_recall": recall,
        "micro_f1": f1,
        "exact_match_docs": exact,
        "exact_match_rate": exact / len(per_doc) if per_doc else 0.0,
        "documents": float(len(per_doc)),
    }
