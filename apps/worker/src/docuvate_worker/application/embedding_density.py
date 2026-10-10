# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Application services for embedding-density classification and calibration."""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from docuvate_worker.domain.embedding_density.calibration import CalibrationThreshold
from docuvate_worker.domain.embedding_density.model import EmbeddingDensityModel
from docuvate_worker.domain.embedding_density.niw import NiwClassStats
from docuvate_worker.domain.embedding_density.niw_compact import (
    decode_f32_matrix,
    decode_f32_vector,
    encode_f32_matrix,
    encode_f32_vector,
)
from docuvate_worker.domain.embedding_density.schemas import (
    CalibrationMetricsPayload,
    CalibrationThresholdPayload,
    ClassifyResultPayload,
    ClassNiwStatsPayload,
    EmbeddingDensityStatePayload,
    EmbeddingDensityStateWithMetricsPayload,
    KernelStatePayload,
    LabelContentMeasurePayload,
)


def _stats_from_payload(dim: int, payload: ClassNiwStatsPayload | None) -> NiwClassStats:
    if payload is None:
        return NiwClassStats.empty(dim)
    if payload.sum_x_f32 is not None:
        sum_x = decode_f32_vector(payload.sum_x_f32, dim)
    else:
        sum_x = np.array(payload.sum_x, dtype=np.float64)
    if payload.sum_xx_f32 is not None:
        sum_xx = decode_f32_matrix(payload.sum_xx_f32, dim)
    else:
        sum_xx = np.array(payload.sum_xx, dtype=np.float64)
    return NiwClassStats(count=payload.count, sum_x=sum_x, sum_xx=sum_xx)


def model_from_state(state: EmbeddingDensityStatePayload) -> EmbeddingDensityModel:
    dim = state.dim
    if dim <= 0 and state.label_ids:
        first = state.class_stats.get(state.label_ids[0])
        dim = len(first.sum_x) if first is not None else 0
    model = EmbeddingDensityModel(label_ids=list(state.label_ids), dim=dim)
    model.temperature = state.temperature
    if state.class_bias:
        model.class_bias = np.array(state.class_bias, dtype=np.float64)
    model.novelty_threshold = state.novelty_threshold
    model.coarse_ready = state.coarse_ready
    model.fine_ready = dict(state.fine_ready)
    model.label_to_group = dict(state.label_to_group)
    for lid in state.label_ids:
        model.class_stats[lid] = _stats_from_payload(dim, state.class_stats.get(lid))
    model.log_priors = dict(state.log_priors)
    for key, raw in state.coarse_thresholds.items():
        model.coarse_thresholds[key] = CalibrationThreshold(
            scope=raw.scope,
            target_id=raw.target_id,
            threshold=raw.threshold,
            lower_bound=raw.lower_bound,
            coverage=raw.coverage,
        )
    for key, raw in state.fine_thresholds.items():
        model.fine_thresholds[key] = CalibrationThreshold(
            scope=raw.scope,
            target_id=raw.target_id,
            threshold=raw.threshold,
            lower_bound=raw.lower_bound,
            coverage=raw.coverage,
        )
    model.kernel.bandwidth = state.kernel.bandwidth
    for point, offsets in zip(state.kernel.points, state.kernel.label_offsets, strict=False):
        model.kernel.add_correction(
            np.array(point, dtype=np.float64),
            np.array(offsets, dtype=np.float64),
        )
    return model


def model_to_state(model: EmbeddingDensityModel) -> EmbeddingDensityStatePayload:
    class_stats: dict[str, ClassNiwStatsPayload] = {}
    for lid, stats in model.class_stats.items():
        class_stats[lid] = ClassNiwStatsPayload(
            count=stats.count,
            sum_x_f32=encode_f32_vector(stats.sum_x),
            sum_xx_f32=encode_f32_matrix(stats.sum_xx),
        )
    return EmbeddingDensityStatePayload(
        label_ids=list(model.label_ids),
        dim=model.dim,
        temperature=model.temperature,
        class_bias=model.class_bias.tolist() if model.class_bias is not None else [],
        novelty_threshold=model.novelty_threshold,
        coarse_ready=model.coarse_ready,
        fine_ready=dict(model.fine_ready),
        label_to_group=dict(model.label_to_group),
        log_priors=dict(model.log_priors),
        class_stats=class_stats,
        coarse_thresholds={
            k: CalibrationThresholdPayload(
                scope=v.scope,
                target_id=v.target_id,
                threshold=v.threshold,
                lower_bound=v.lower_bound,
                coverage=v.coverage,
            )
            for k, v in model.coarse_thresholds.items()
        },
        fine_thresholds={
            k: CalibrationThresholdPayload(
                scope=v.scope,
                target_id=v.target_id,
                threshold=v.threshold,
                lower_bound=v.lower_bound,
                coverage=v.coverage,
            )
            for k, v in model.fine_thresholds.items()
        },
        kernel=KernelStatePayload(
            bandwidth=model.kernel.bandwidth,
            points=[p.tolist() for p in model.kernel.points],
            label_offsets=[o.tolist() for o in model.kernel.label_offsets],
        ),
    )


def classify_embedding(
    state: EmbeddingDensityStatePayload,
    vector: list[float],
) -> ClassifyResultPayload:
    model = model_from_state(state)
    x: NDArray[np.float64] = np.array(vector, dtype=np.float64)
    outcome = model.classify(x)
    probs, log_px = model.posterior(x)
    return ClassifyResultPayload(
        decision_tier=outcome.tier.value,
        confidence=outcome.confidence,
        label_id=outcome.label_id,
        group_id=outcome.group_id,
        reason=outcome.reason.value,
        log_px=log_px,
        posterior={lid: float(probs[i]) for i, lid in enumerate(model.label_ids)},
        confirm_label_id=outcome.confirm_label_id,
        confirm_confidence=outcome.confirm_confidence,
    )


def record_correction(
    state: EmbeddingDensityStatePayload,
    vector: list[float],
    target_label_id: str,
    *,
    strength: float = 4.0,
) -> EmbeddingDensityStatePayload:
    model = model_from_state(state)
    model.apply_correction(np.array(vector, dtype=np.float64), target_label_id, strength=strength)
    return model_to_state(model)


def run_calibration(
    state: EmbeddingDensityStatePayload,
    vectors: list[list[float]],
    label_ids: list[str],
    *,
    delta: float = 0.05,
    document_ids: list[str] | None = None,
) -> EmbeddingDensityStateWithMetricsPayload:
    model = model_from_state(state)
    arr: NDArray[np.float64] = np.array(vectors, dtype=np.float64)
    label_index = {lid: i for i, lid in enumerate(model.label_ids)}
    y: NDArray[np.int64] = np.array([label_index[lid] for lid in label_ids], dtype=np.int64)
    if document_ids is None or len(document_ids) != len(vectors):
        raise ValueError("document_ids required with one id per vector for held-out calibration")
    metrics_raw = model.fit_calibration(arr, y, delta=delta, document_ids=document_ids)
    base = model_to_state(model)
    metrics = CalibrationMetricsPayload(
        coarse_accepted_blocks=float(metrics_raw["coarse_accepted_blocks"]),
        fine_labels_calibrated=float(metrics_raw["fine_labels_calibrated"]),
        coarse_ready=float(metrics_raw["coarse_ready"]),
        fine_ready_labels=float(metrics_raw["fine_ready_labels"]),
    )
    return EmbeddingDensityStateWithMetricsPayload(**base.model_dump(), metrics=metrics)


def train_from_labeled_examples(
    label_ids: list[str],
    vectors: list[list[float]],
    example_label_ids: list[str],
    unlabeled_vectors: list[list[float]] | None = None,
) -> EmbeddingDensityStatePayload:
    dim = len(vectors[0]) if vectors else 0
    model = EmbeddingDensityModel(label_ids=label_ids, dim=dim)
    if unlabeled_vectors:
        model.structure_bank = model.structure_bank.build_from_unlabeled(
            [np.array(v, dtype=np.float64) for v in unlabeled_vectors]
        )
    for vec, lid in zip(vectors, example_label_ids, strict=True):
        model.add_training_example(lid, np.array(vec, dtype=np.float64))
    return model_to_state(model)


def content_space_report(state: EmbeddingDensityStatePayload) -> list[LabelContentMeasurePayload]:
    model = model_from_state(state)
    return [
        LabelContentMeasurePayload(
            label_id=m.label_id,
            prior_mass=m.prior_mass,
            log_std_per_dim=m.log_std_per_dim,
            effective_rank=m.effective_rank,
            overlap_top_partner=m.overlap_top_partner,
            overlap_mass=m.overlap_mass,
        )
        for m in model.content_measures()
    ]
