# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Workspace label-automation presets mapped to the ranker's decision parameters."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

LabelAutoAssignPreset = Literal["off", "cautious", "normal"]
LabelSuggestionPreset = Literal["few", "normal", "many"]


@dataclass(frozen=True)
class SuggestionPolicy:
    """How eagerly a label is suggested; ``normal`` reproduces the calibrated defaults."""

    false_positive_cost: float
    precision_target: float
    zero_shot_offset: float


_AUTO_ASSIGN_PRECISION: dict[LabelAutoAssignPreset, float | None] = {
    "off": None,
    "cautious": 0.99,
    "normal": 0.98,
}

_SUGGESTION_POLICIES: dict[LabelSuggestionPreset, SuggestionPolicy] = {
    "few": SuggestionPolicy(
        false_positive_cost=5.0,
        precision_target=0.99,
        zero_shot_offset=0.05,
    ),
    "normal": SuggestionPolicy(
        false_positive_cost=3.0,
        precision_target=0.97,
        zero_shot_offset=0.0,
    ),
    "many": SuggestionPolicy(
        false_positive_cost=1.0,
        precision_target=0.90,
        zero_shot_offset=-0.05,
    ),
}


def auto_assign_precision_target(preset: LabelAutoAssignPreset) -> float | None:
    """Target precision for learned auto-assignment, or ``None`` when it is switched off."""
    return _AUTO_ASSIGN_PRECISION[preset]


def suggestion_policy(preset: LabelSuggestionPreset) -> SuggestionPolicy:
    return _SUGGESTION_POLICIES[preset]
