# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Unified field-extraction eval on original dataset OCR text (document-level micro-F1)."""

from __future__ import annotations

import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Literal, Sequence

REPO_ROOT = Path(__file__).resolve().parents[3]
BASELINE_SCRIPTS = REPO_ROOT / "research" / "extraction_baseline" / "scripts"
WORKER_SRC = REPO_ROOT / "apps" / "worker" / "src"

if str(BASELINE_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(BASELINE_SCRIPTS))
if str(WORKER_SRC) not in sys.path:
    sys.path.insert(0, str(WORKER_SRC))

from common import (  # noqa: E402
    CORD_GLINER_ENTITY_TYPES,
    SROIE_GLINER_ENTITY_TYPES,
    FieldExample,
    FieldPrediction,
    aggregate_scores,
    build_field_examples_cord,
    build_field_examples_sroie,
    score_field_level,
)
from extractors import gliner_extract  # noqa: E402

DatasetName = Literal["cord", "sroie"]
GlinerFamily = Literal["gliner2-base-v1"]


@dataclass(frozen=True)
class UnifiedGlinerConfig:
    """Single protocol for all GLiNER field benchmarks in v0.1.0 research."""

    family: GlinerFamily = "gliner2-base-v1"
    model_id: str = "fastino/gliner2-base-v1"
    hf_revision: str = "f9634218e53580c56edf0de97ca1a7d3f1c2354e"
    license_spdx: str = "Apache-2.0"
    batch_size: int = 1
    text_source: str = "original_ocr_joined_lines"
    scoring: str = "document_level_micro_f1_canonical_keys"
    match_policy: str = "common.match_key + normalize_value exact"


def entity_types_for_dataset(name: DatasetName) -> tuple[str, ...]:
    if name == "cord":
        return CORD_GLINER_ENTITY_TYPES
    if name == "sroie":
        return SROIE_GLINER_ENTITY_TYPES
    msg = f"unknown dataset {name}"
    raise ValueError(msg)


def predictions_from_gliner2_batch(
    text: str,
    entity_types: Sequence[str],
) -> list[FieldPrediction]:
    return gliner_extract(text, entity_types)


def evaluate_examples_document_level(
    examples: Sequence[FieldExample],
    predict: Callable[[str, Sequence[str]], list[FieldPrediction]],
    entity_types: Sequence[str],
) -> tuple[dict[str, float], list[float]]:
    per_doc: list[dict[str, float | int]] = []
    latencies_ms: list[float] = []
    for ex in examples:
        t0 = time.perf_counter()
        preds = predict(ex.text, entity_types)
        latencies_ms.append((time.perf_counter() - t0) * 1000.0)
        per_doc.append(score_field_level(preds, ex.canonical_gt, abstain_threshold=None))
    agg = aggregate_scores(per_doc)
    latencies_ms.sort()
    mid = latencies_ms[len(latencies_ms) // 2] if latencies_ms else 0.0
    p95_idx = int(round(0.95 * (len(latencies_ms) - 1))) if latencies_ms else 0
    agg["latency_ms_median"] = mid
    agg["latency_ms_p95"] = latencies_ms[p95_idx] if latencies_ms else 0.0
    return agg, latencies_ms


def build_examples_from_rows(
    dataset: DatasetName,
    cord_rows: list[dict] | None,
    sroie_rows: list[dict] | None,
) -> list[FieldExample]:
    if dataset == "cord":
        if cord_rows is None:
            msg = "cord_rows required"
            raise ValueError(msg)
        return build_field_examples_cord(cord_rows)
    if sroie_rows is None:
        msg = "sroie_rows required"
        raise ValueError(msg)
    return build_field_examples_sroie(sroie_rows)


def unified_gliner2_base_metrics(
    examples: Sequence[FieldExample],
    dataset: DatasetName,
) -> dict[str, object]:
    """Warm global GLiNER2 model once; one forward pass per document on full OCR text."""
    cfg = UnifiedGlinerConfig()
    entity_types = entity_types_for_dataset(dataset)
    t_warm = time.perf_counter()
    predict = predictions_from_gliner2_batch
    predict(examples[0].text if examples else "", entity_types)
    warm_s = time.perf_counter() - t_warm
    agg, _lat = evaluate_examples_document_level(examples, predict, entity_types)
    return {
        "protocol": cfg.__dict__,
        "dataset": dataset,
        "documents": len(examples),
        **agg,
        "warmup_seconds_including_first_doc": warm_s,
    }
