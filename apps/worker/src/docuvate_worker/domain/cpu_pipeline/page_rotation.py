# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Dominant text rotation per page from positioned text spans."""

from __future__ import annotations

import math
from collections import defaultdict
from collections.abc import Iterable

from docuvate_worker.domain.layout_ir import LayoutIrBlock, LayoutIrPage

_QUARTER_TURN_DEG = 90.0


def _quarter_turn(rotation_deg: float | None) -> float:
    if rotation_deg is None:
        return 0.0
    turns = round(rotation_deg / _QUARTER_TURN_DEG) % 4
    signed = math.remainder(turns * _QUARTER_TURN_DEG, 360.0) + 0.0
    return 180.0 if signed == -180.0 else signed


def dominant_rotation_deg(blocks: Iterable[LayoutIrBlock]) -> float:
    """Return the quarter-turn rotation carrying the most text on a page.

    Upright spans have ``rotation_deg is None``. Each span votes for its nearest quarter turn,
    weighted by its visible character count. Ties and empty pages resolve to upright.
    """
    votes: defaultdict[float, int] = defaultdict(int)
    for block in blocks:
        weight = len(block.text.strip())
        if weight:
            votes[_quarter_turn(block.rotation_deg)] += weight
    if not votes:
        return 0.0
    return max(sorted(votes), key=lambda turn: (votes[turn], turn == 0.0))


def page_rotations_deg(pages: Iterable[LayoutIrPage]) -> tuple[float, ...]:
    return tuple(dominant_rotation_deg(page.blocks) for page in pages)
