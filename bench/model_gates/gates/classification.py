# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Embedding-density gate on fastembed vectors (8 labels, imbalanced, overlapping text)."""

from __future__ import annotations

from pathlib import Path

import numpy as np

from docuvate_worker.application.embedding_density import (
    classify_embedding,
    model_from_state,
    model_to_state,
    run_calibration,
    train_from_labeled_examples,
)
from docuvate_worker.domain.embedding_density.calibration import split_embedding_density_documents
from docuvate_worker.domain.embedding_density.schemas import EmbeddingDensityStateWithMetricsPayload
from docuvate_worker.infrastructure.fastembed_model import embed_passages

from bench.model_gates.json_models import ClassificationFixturesFile, ClassificationTextExample
from bench.model_gates.schema import GateRunResult, MetricValue

GATE_ID = "classification"
_FIXTURES = Path(__file__).resolve().parent.parent / "fixtures" / "classification_texts.json"
_HOLDOUT_LABEL = "werkstattbericht"
_EVAL_SEED = 20261012
_EMBED_BATCH = 64


def _load_fixtures() -> ClassificationFixturesFile:
    return ClassificationFixturesFile.model_validate_json(_FIXTURES.read_text(encoding="utf-8"))


def _embed_texts(texts: list[str]) -> list[list[float]]:
    vectors: list[list[float]] = []
    for start in range(0, len(texts), _EMBED_BATCH):
        batch = texts[start : start + _EMBED_BATCH]
        vectors.extend(embed_passages(batch))
    return vectors


def _vectors_for_examples(examples: list[ClassificationTextExample]) -> list[list[float]]:
    return _embed_texts([ex.text for ex in examples])


def run_classification_gate() -> GateRunResult:
    fixtures = _load_fixtures()
    train_examples = [ex for ex in fixtures.examples if ex.label_id in fixtures.label_ids]
    holdout_examples = [ex for ex in fixtures.examples if ex.label_id == _HOLDOUT_LABEL]
    if not train_examples:
        return GateRunResult(gate_id=GATE_ID, status="error", metrics=(), detail="no train examples")

    vectors = _vectors_for_examples(train_examples)
    train_y = [ex.label_id for ex in train_examples]
    train_docs = [ex.document_id for ex in train_examples]

    state = train_from_labeled_examples(fixtures.label_ids, vectors, train_y)
    model = model_from_state(state)
    calibrated: EmbeddingDensityStateWithMetricsPayload = run_calibration(
        model_to_state(model),
        vectors,
        train_y,
        delta=0.08,
        document_ids=train_docs,
    )
    state_payload = calibrated

    doc_split = split_embedding_density_documents(
        train_docs,
        rng=np.random.default_rng(_EVAL_SEED),
    )
    if doc_split.test_indices.size == 0:
        return GateRunResult(gate_id=GATE_ID, status="error", metrics=(), detail="empty held-out split")

    scored_correct = 0
    scored_total = 0
    covered = 0
    test_indices: list[int] = [int(i) for i in doc_split.test_indices.tolist()]
    test_count = len(test_indices)
    for index in test_indices:
        row: list[float] = vectors[index]
        label = train_y[index]
        result = classify_embedding(state_payload, row)
        if result.decision_tier in ("auto_apply", "confirm"):
            covered += 1
            predicted = result.label_id or result.confirm_label_id
            if predicted:
                scored_total += 1
                if predicted == label:
                    scored_correct += 1

    precision = 0.0 if scored_total == 0 else scored_correct / scored_total
    coverage_rate = covered / max(test_count, 1)

    novel_vectors = _vectors_for_examples(holdout_examples)
    novel_abstain = 0
    for vec in novel_vectors:
        result = classify_embedding(state_payload, vec)
        if result.decision_tier != "auto_apply":
            novel_abstain += 1
    novel_abstain_rate = novel_abstain / max(len(holdout_examples), 1)

    metrics = (
        MetricValue(
            name=f"{GATE_ID}.coarse_precision_at_threshold",
            value=precision,
            direction="higher_is_better",
        ),
        MetricValue(
            name=f"{GATE_ID}.coarse_coverage_rate",
            value=coverage_rate,
            direction="higher_is_better",
        ),
        MetricValue(
            name=f"{GATE_ID}.novel_abstain_rate",
            value=novel_abstain_rate,
            direction="higher_is_better",
        ),
    )
    return GateRunResult(
        gate_id=GATE_ID,
        status="ok",
        metrics=metrics,
        detail=f"train={len(train_examples)} holdout={doc_split.test_indices.size} novel={len(holdout_examples)}",
    )
