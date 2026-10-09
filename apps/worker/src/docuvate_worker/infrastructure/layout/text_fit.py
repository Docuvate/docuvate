# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Estimate horizontal scale so rendered text matches PDF word bbox width."""

from __future__ import annotations


def horizontal_scale_factor(
    text: str,
    font_size_pt: float,
    target_width_pt: float,
    *,
    bold: bool = False,
) -> float:
    stripped = text.rstrip()
    if not stripped or target_width_pt <= 0 or font_size_pt <= 0:
        return 1.0
    # Liberation bold runs wider than 0.48em vs PDF Frutiger bbox — bias high, then shrink only.
    em = 0.62 if bold else 0.5
    estimated = len(stripped) * font_size_pt * em
    if estimated <= 0:
        return 1.0
    scale = target_width_pt / estimated
    return max(0.85, min(1.15, scale))
