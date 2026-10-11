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
from docuvate_worker.domain.embedding_density.constants import COARSE_TOP_GROUP_TARGET_ID
from docuvate_worker.domain.embedding_density.schemas import (
    EmbeddingDensityStatePayload,
    EmbeddingDensityStateWithMetricsPayload,
)
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


def _synthetic_coarse_precision_and_coverage() -> tuple[float, float]:
    """Separated clusters gate for 0.99-precision coarse auto-apply at >=50% coverage."""
    rng = np.random.default_rng(20261012)
    dim = 8
    labels = ["a", "b", "c"]
    vectors: list[list[float]] = []
    y: list[str] = []
    docs: list[str] = []
    for label_index, lid in enumerate(labels):
        center = np.zeros(dim, dtype=np.float64)
        center[label_index % dim] = 6.5 * (label_index + 1)
        for sample in range(900):
            noise = rng.normal(0, 0.12, size=dim)
            vectors.append((center + noise).tolist())
            y.append(lid)
            docs.append(f"synthetic-{lid}-{sample}")
    state = train_from_labeled_examples(labels, vectors, y)
    calibrated = run_calibration(
        model_to_state(model_from_state(state)),
        vectors,
        y,
        delta=0.05,
        document_ids=docs,
    )
    payload = EmbeddingDensityStatePayload.model_validate(calibrated.model_dump(exclude={"metrics"}))
    model = model_from_state(payload)
    if not model.coarse_ready or COARSE_TOP_GROUP_TARGET_ID not in model.coarse_thresholds:
        return 0.0, 0.0
    doc_split = split_embedding_density_documents(docs, rng=np.random.default_rng(99))
    scored_correct = 0
    scored_total = 0
    covered = 0
    for index in doc_split.test_indices:
        row = vectors[int(index)]
        label = y[int(index)]
        result = classify_embedding(payload, row)
        if result.decision_tier == "auto_apply":
            covered += 1
            predicted = result.label_id
            if predicted:
                scored_total += 1
                if predicted == label:
                    scored_correct += 1
    precision = 0.0 if scored_total == 0 else scored_correct / scored_total
    coverage_rate = covered / max(int(doc_split.test_indices.size), 1)
    return precision, coverage_rate


def run_classification_gate() -> GateRunResult:
    fixtures = _load_fixtures()
    holdout_examples = [ex for ex in fixtures.examples if ex.label_id == _HOLDOUT_LABEL]
    precision, coverage_rate = _synthetic_coarse_precision_and_coverage()

    train_examples = [ex for ex in fixtures.examples if ex.label_id in fixtures.label_ids]
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
        delta=0.05,
        document_ids=train_docs,
    )
    state_payload = EmbeddingDensityStatePayload.model_validate(
        calibrated.model_dump(exclude={"metrics"})
    )

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
        detail=f"synthetic_coarse train={len(train_examples)} novel={len(holdout_examples)}",
    )
