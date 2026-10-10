# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Wire and API models for embedding-density classification."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class CalibrationThresholdPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scope: str
    target_id: str
    threshold: float
    lower_bound: float
    coverage: float


def _empty_matrix() -> list[list[float]]:
    return []


def _empty_float_list() -> list[float]:
    return []


class ClassNiwStatsPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    count: int
    sum_x: list[float] = Field(default_factory=_empty_float_list)
    sum_xx: list[list[float]] = Field(default_factory=_empty_matrix)
    sum_x_f32: str | None = None
    sum_xx_f32: str | None = None


class KernelStatePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    bandwidth: float = 0.5
    points: list[list[float]] = Field(default_factory=_empty_matrix)
    label_offsets: list[list[float]] = Field(default_factory=_empty_matrix)


class EmbeddingDensityStatePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label_ids: list[str] = Field(default_factory=list)
    dim: int = 0
    temperature: float = 1.0
    class_bias: list[float] = Field(default_factory=_empty_float_list)
    novelty_threshold: float = float("-inf")
    coarse_ready: bool = False
    fine_ready: dict[str, bool] = Field(default_factory=dict)
    label_to_group: dict[str, str] = Field(default_factory=dict)
    log_priors: dict[str, float] = Field(default_factory=dict)
    class_stats: dict[str, ClassNiwStatsPayload] = Field(default_factory=dict)
    coarse_thresholds: dict[str, CalibrationThresholdPayload] = Field(default_factory=dict)
    fine_thresholds: dict[str, CalibrationThresholdPayload] = Field(default_factory=dict)
    kernel: KernelStatePayload = Field(default_factory=KernelStatePayload)


class CalibrationMetricsPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    coarse_accepted_blocks: float
    fine_labels_calibrated: float
    coarse_ready: float
    fine_ready_labels: float


class EmbeddingDensityStateWithMetricsPayload(EmbeddingDensityStatePayload):
    metrics: CalibrationMetricsPayload | None = None


class ClassifyResultPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    decision_tier: str
    confidence: float
    label_id: str | None
    group_id: str | None
    reason: str
    log_px: float
    posterior: dict[str, float] = Field(default_factory=dict)
    confirm_label_id: str | None = None
    confirm_confidence: float = 0.0


class LabelContentMeasurePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label_id: str
    prior_mass: float
    log_std_per_dim: float
    effective_rank: float
    overlap_top_partner: str | None
    overlap_mass: float
