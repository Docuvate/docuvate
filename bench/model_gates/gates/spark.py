# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""SPARK correction gates: cross-org isolation and learning curve after few corrections."""

from __future__ import annotations

import numpy as np

from docuvate_worker.application.embedding_density import (
    classify_embedding,
    model_from_state,
    model_to_state,
    record_correction,
    run_calibration,
    train_from_labeled_examples,
)
from docuvate_worker.domain.embedding_density.kernel import KernelCorrector
from docuvate_worker.domain.embedding_density.schemas import EmbeddingDensityStatePayload

from bench.model_gates.schema import GateRunResult, MetricValue

GATE_ID = "spark"


def _synthetic_clusters(
    rng: np.random.Generator,
    *,
    dim: int,
    per_class: int,
    separation: float,
    prefix: str,
) -> tuple[np.ndarray, list[str], list[str], list[str]]:
    label_ids = ['alpha', 'beta', 'gamma', 'novel']
    vectors: list[list[float]] = []
    labels: list[str] = []
    docs: list[str] = []
    for label_index, label_id in enumerate(label_ids):
        center = np.zeros(dim, dtype=np.float64)
        center[label_index % dim] = separation * (label_index + 1)
        for sample in range(per_class):
            noise = rng.normal(0, 0.35, size=dim)
            vectors.append((center + noise).tolist())
            labels.append(label_id)
            docs.append(f'{prefix}-{label_id}-{sample}')
    return np.array(vectors, dtype=np.float64), labels, label_ids, docs


def run_spark_gates() -> tuple[GateRunResult, ...]:
    cross_org = _run_cross_org_gate()
    learning = _run_learning_curve_gate()
    return (cross_org, learning)


def _run_cross_org_gate() -> GateRunResult:
    kernel = KernelCorrector(cross_org_strength=0.0)
    point = np.array([0.2, 0.1, 0.0])
    offsets = np.array([1.0, -1.0])
    kernel.add_correction(point, offsets, organization_id='org-a')
    delta_other = kernel.log_odds_delta(point, 2, organization_id='org-b')
    delta_same = kernel.log_odds_delta(point, 2, organization_id='org-a')
    regression = float(np.max(np.abs(delta_other)))
    return GateRunResult(
        gate_id=GATE_ID,
        status='ok',
        metrics=(
            MetricValue(
                name=f'{GATE_ID}.cross_org_regression',
                value=regression,
                direction='lower_is_better',
            ),
        ),
        detail='kernel log-odds delta for foreign org should be 0',
    )


def _mean_novel_top1_accuracy(
    state: EmbeddingDensityStatePayload,
    vectors: list[list[float]],
) -> float:
    if not vectors:
        return 0.0
    hits = 0
    for vec in vectors:
        result = classify_embedding(state, vec)
        top = max(result.posterior, key=result.posterior.get)
        if top == 'novel':
            hits += 1
    return hits / len(vectors)


def _mean_novel_posterior_mass(
    state: EmbeddingDensityStatePayload,
    vectors: list[list[float]],
) -> float:
    if not vectors:
        return 0.0
    total = 0.0
    for vec in vectors:
        result = classify_embedding(state, vec)
        total += float(result.posterior.get('novel', 0.0))
    return total / len(vectors)


def _run_learning_curve_gate() -> GateRunResult:
    rng = np.random.default_rng(20261011)
    dim = 8
    train_x, train_y, label_ids, train_docs = _synthetic_clusters(
        rng, dim=dim, per_class=120, separation=2.8, prefix='learn'
    )
    # Hold out "novel" class from training; teach it with three corrections.
    train_mask = np.array([y != 'novel' for y in train_y])
    base_vectors = train_x[train_mask].tolist()
    base_labels = [y for y, keep in zip(train_y, train_mask, strict=True) if keep]
    base_docs = [d for d, keep in zip(train_docs, train_mask, strict=True) if keep]
    state = train_from_labeled_examples(label_ids, base_vectors, base_labels)
    calibrated = run_calibration(
        model_to_state(model_from_state(state)),
        base_vectors,
        base_labels,
        delta=0.05,
        document_ids=base_docs,
    )
    state_payload = EmbeddingDensityStatePayload.model_validate(
        calibrated.model_dump(exclude={'metrics'})
    )

    novel_indices = [i for i, y in enumerate(train_y) if y == 'novel']
    novel_vectors = [train_x[i].tolist() for i in novel_indices]
    correction_vectors = novel_vectors[:3]
    eval_vectors = novel_vectors[3:]

    def state_after_corrections(n_corrections: int) -> EmbeddingDensityStatePayload:
        working = state_payload
        for idx in range(n_corrections):
            working = EmbeddingDensityStatePayload.model_validate(
                record_correction(
                    working,
                    correction_vectors[idx],
                    'novel',
                    strength=6.0,
                ).model_dump()
            )
        return working

    after_zero = _mean_novel_posterior_mass(state_payload, eval_vectors)
    after_three = _mean_novel_posterior_mass(state_after_corrections(3), eval_vectors)
    lift = after_three - after_zero

    return GateRunResult(
        gate_id=GATE_ID,
        status='ok',
        metrics=(
            MetricValue(
                name=f'{GATE_ID}.learning_curve_lift_after_3',
                value=lift,
                direction='higher_is_better',
            ),
            MetricValue(
                name=f'{GATE_ID}.learning_curve_accuracy_after_3',
                value=_mean_novel_top1_accuracy(state_after_corrections(3), eval_vectors),
                direction='higher_is_better',
            ),
        ),
        detail=f'novel posterior mass before={after_zero:.3f} after 3={after_three:.3f}',
    )
