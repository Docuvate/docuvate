# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Embedding-density classification gate on a frozen synthetic split."""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from docuvate_worker.application.embedding_density import (
    classify_embedding,
    model_from_state,
    model_to_state,
    run_calibration,
    train_from_labeled_examples,
)
from docuvate_worker.domain.embedding_density.calibration import split_embedding_density_documents
from docuvate_worker.domain.embedding_density.schemas import (
    EmbeddingDensityStatePayload,
    EmbeddingDensityStateWithMetricsPayload,
)

from bench.model_gates.schema import GateRunResult, MetricValue

GATE_ID = "classification"

# Frozen synthetic eval (seed + hyperparameters); no personal data.
_EVAL_SEED = 20261011
_TRAIN_PER_CLASS = 900
_DIM = 8
_SEPARATION = 6.5


def _separated_clusters(
    rng: np.random.Generator,
    *,
    dim: int,
    per_class: int,
    separation: float,
    doc_prefix: str,
) -> tuple[NDArray[np.float64], list[str], list[str], list[str]]:
    labels = ["a", "b", "c"]
    vectors: list[NDArray[np.float64]] = []
    y: list[str] = []
    doc_ids: list[str] = []
    for i, label in enumerate(labels):
        center = np.zeros(dim, dtype=np.float64)
        center[i % dim] = separation * (i + 1)
        for j in range(per_class):
            doc = f"{doc_prefix}-{label}-{j}"
            vectors.append(center + rng.normal(0, 0.12, size=dim))
            y.append(label)
            doc_ids.append(doc)
    return np.stack(vectors), y, labels, doc_ids


def run_classification_gate() -> GateRunResult:
    rng = np.random.default_rng(_EVAL_SEED)
    train_x, train_y, label_ids, train_docs = _separated_clusters(
        rng,
        dim=_DIM,
        per_class=_TRAIN_PER_CLASS,
        separation=_SEPARATION,
        doc_prefix="mg-eval",
    )
    state = train_from_labeled_examples(label_ids, train_x.tolist(), train_y)
    model = model_from_state(state)
    calibrated: EmbeddingDensityStateWithMetricsPayload = run_calibration(
        model_to_state(model),
        train_x.tolist(),
        train_y,
        delta=0.05,
        document_ids=train_docs,
    )
    state_payload: EmbeddingDensityStatePayload = calibrated

    doc_split = split_embedding_density_documents(train_docs, rng=np.random.default_rng(_EVAL_SEED))
    if doc_split.test_indices.size == 0:
        return GateRunResult(
            gate_id=GATE_ID,
            status="error",
            metrics=(),
            detail="empty held-out split",
        )

    coarse_correct = 0
    coarse_total = 0
    for idx in doc_split.test_indices:
        row = train_x[idx]
        label: str = train_y[int(idx)]
        result = classify_embedding(state_payload, row.tolist())
        if result.decision_tier == "auto_apply":
            coarse_total += 1
            if result.label_id == label:
                coarse_correct += 1

    if coarse_total == 0:
        precision = 0.0
    else:
        precision = coarse_correct / coarse_total

    metrics = (
        MetricValue(
            name=f"{GATE_ID}.coarse_precision_at_threshold",
            value=precision,
            direction="higher_is_better",
        ),
        MetricValue(
            name=f"{GATE_ID}.coarse_coverage_count",
            value=float(coarse_total),
            direction="higher_is_better",
        ),
    )
    return GateRunResult(
        gate_id=GATE_ID,
        status="ok",
        metrics=metrics,
        detail=f"held_out={doc_split.test_indices.size} auto_apply={coarse_total}",
    )
