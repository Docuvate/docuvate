# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Two-tier decisions: coarse auto-apply and fine confirm suggestions (independent)."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

import numpy as np
from numpy.typing import NDArray

from docuvate_worker.domain.embedding_density.calibration import (
    CalibrationThreshold,
    posterior_log_odds,
)
from docuvate_worker.domain.embedding_density.constants import COARSE_TOP_GROUP_TARGET_ID
from docuvate_worker.domain.embedding_density.novelty import is_novel


class DecisionTier(StrEnum):
    AUTO_APPLY = "auto_apply"
    CONFIRM = "confirm"
    NONE = "none"


class ReasonCode(StrEnum):
    NOVELTY = "novelty"
    THRESHOLD_COARSE = "threshold_coarse"
    THRESHOLD_FINE = "threshold_fine"
    INSUFFICIENT_CALIBRATION = "insufficient_calibration"
    BELOW_THRESHOLD = "below_threshold"


def top_group_mass_and_id(
    posterior: NDArray[np.float64],
    label_ids: list[str],
    label_to_group: dict[str, str],
) -> tuple[float, str | None]:
    group_scores: dict[str, float] = {}
    for idx, lid in enumerate(label_ids):
        gid = label_to_group.get(lid, lid)
        group_scores[gid] = group_scores.get(gid, 0.0) + float(posterior[idx])
    if not group_scores:
        return 0.0, None
    best_group = max(group_scores.items(), key=lambda t: t[1])
    return best_group[1], best_group[0]


@dataclass(frozen=True)
class DecisionOutcome:
    tier: DecisionTier
    label_id: str | None
    group_id: str | None
    confidence: float
    reason: ReasonCode
    log_px: float
    confirm_label_id: str | None = None
    confirm_confidence: float = 0.0
    confirm_reason: ReasonCode | None = None


def decide_document(
    *,
    label_ids: list[str],
    posterior: NDArray[np.float64],
    log_px: float,
    novelty_threshold: float,
    coarse_thresholds: dict[str, CalibrationThreshold],
    fine_thresholds: dict[str, CalibrationThreshold],
    label_to_group: dict[str, str],
    coarse_ready: bool,
    fine_ready: dict[str, bool],
) -> DecisionOutcome:
    any_fine_ready = any(fine_ready.get(lid, False) for lid in label_ids)
    if not coarse_ready and not any_fine_ready:
        return DecisionOutcome(
            tier=DecisionTier.NONE,
            label_id=None,
            group_id=None,
            confidence=float(np.max(posterior)) if posterior.size else 0.0,
            reason=ReasonCode.INSUFFICIENT_CALIBRATION,
            log_px=log_px,
        )

    if is_novel(log_px, novelty_threshold):
        return DecisionOutcome(
            tier=DecisionTier.NONE,
            label_id=None,
            group_id=None,
            confidence=float(np.max(posterior)) if posterior.size else 0.0,
            reason=ReasonCode.NOVELTY,
            log_px=log_px,
        )

    group_conf, group_id = top_group_mass_and_id(posterior, label_ids, label_to_group)

    coarse_tier = DecisionTier.NONE
    coarse_label: str | None = None
    coarse_reason = ReasonCode.BELOW_THRESHOLD
    coarse = coarse_thresholds.get(COARSE_TOP_GROUP_TARGET_ID)
    coarse_log_odds = posterior_log_odds(group_conf)
    if (
        coarse_ready
        and group_id is not None
        and coarse is not None
        and coarse_log_odds >= coarse.threshold
    ):
        coarse_tier = DecisionTier.AUTO_APPLY
        group_labels = [lid for lid in label_ids if label_to_group.get(lid, lid) == group_id]
        if group_labels:
            coarse_label = max(
                group_labels,
                key=lambda lid: float(posterior[label_ids.index(lid)]),
            )
        coarse_reason = ReasonCode.THRESHOLD_COARSE

    best_idx = int(np.argmax(posterior)) if posterior.size else -1
    fine_label: str | None = None
    fine_conf = 0.0
    fine_reason: ReasonCode | None = None
    if best_idx >= 0:
        fine_label = label_ids[best_idx]
        fine_conf = float(posterior[best_idx])
        fine_thr = fine_thresholds.get(fine_label)
        fine_log_odds = posterior_log_odds(fine_conf)
        if (
            fine_thr is not None
            and fine_ready.get(fine_label, False)
            and fine_log_odds >= fine_thr.threshold
        ):
            fine_reason = ReasonCode.THRESHOLD_FINE

    if coarse_tier == DecisionTier.AUTO_APPLY:
        return DecisionOutcome(
            tier=DecisionTier.AUTO_APPLY,
            label_id=coarse_label,
            group_id=group_id,
            confidence=group_conf,
            reason=coarse_reason,
            log_px=log_px,
            confirm_label_id=fine_label if fine_reason == ReasonCode.THRESHOLD_FINE else None,
            confirm_confidence=fine_conf if fine_reason == ReasonCode.THRESHOLD_FINE else 0.0,
            confirm_reason=fine_reason,
        )

    if fine_reason == ReasonCode.THRESHOLD_FINE and fine_label is not None:
        return DecisionOutcome(
            tier=DecisionTier.CONFIRM,
            label_id=fine_label,
            group_id=label_to_group.get(fine_label),
            confidence=fine_conf,
            reason=ReasonCode.THRESHOLD_FINE,
            log_px=log_px,
        )

    return DecisionOutcome(
        tier=DecisionTier.NONE,
        label_id=None,
        group_id=label_to_group.get(fine_label) if fine_label else None,
        confidence=fine_conf,
        reason=ReasonCode.BELOW_THRESHOLD,
        log_px=log_px,
    )
