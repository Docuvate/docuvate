# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Orient a page image before OCR and map boxes back to the unrotated MediaBox."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

QuarterTurns = int  # 0..3 clockwise
PageImage = NDArray[np.uint8]


@dataclass(frozen=True)
class OrientedPage:
    """Page raster ready for OCR plus the clockwise quarter turns applied to the source."""

    image: PageImage
    quarter_turns_cw: QuarterTurns


def rotate_image_cw(image: PageImage, quarter_turns_cw: QuarterTurns) -> PageImage:
    turns = int(quarter_turns_cw) % 4
    if turns == 0:
        return image
    # np.rot90 rotates counter-clockwise; negate for clockwise.
    return np.ascontiguousarray(np.rot90(image, k=-turns))


def map_norm_box_to_unrotated(
    x: float,
    y: float,
    width: float,
    height: float,
    quarter_turns_cw: QuarterTurns,
) -> tuple[float, float, float, float]:
    """Map an OCR-normalized box (origin top-left) back to the unrotated page."""
    turns = int(quarter_turns_cw) % 4
    x0, y0 = x, y
    x1, y1 = x + width, y + height
    if turns == 0:
        return x0, y0, width, height
    if turns == 1:
        # np.rot90(..., k=-1): source (row, col) lands at (col, height-1-row).
        # OCR (x, y) ← source (1-y, x), so source ← (y, 1-x).
        sx0, sy0 = y0, 1.0 - x1
        sx1, sy1 = y1, 1.0 - x0
    elif turns == 2:
        sx0, sy0 = 1.0 - x1, 1.0 - y1
        sx1, sy1 = 1.0 - x0, 1.0 - y0
    else:
        # 270° clockwise is rot90 k=-3. Inverse of the 90° case.
        sx0, sy0 = 1.0 - y1, x0
        sx1, sy1 = 1.0 - y0, x1
    nx0, nx1 = sorted((sx0, sx1))
    ny0, ny1 = sorted((sy0, sy1))
    nx0 = min(1.0, max(0.0, nx0))
    ny0 = min(1.0, max(0.0, ny0))
    nx1 = min(1.0, max(0.0, nx1))
    ny1 = min(1.0, max(0.0, ny1))
    return nx0, ny0, max(0.0, nx1 - nx0), max(0.0, ny1 - ny0)


def _downsample(image: PageImage, max_side: int = 512) -> PageImage:
    height, width = image.shape[:2]
    scale = min(1.0, float(max_side) / float(max(height, width)))
    if scale >= 0.999:
        return image
    new_w = max(1, round(width * scale))
    new_h = max(1, round(height * scale))
    # Nearest-neighbour via slicing strides — avoid a hard OpenCV dependency here.
    y_idx = (np.linspace(0, height - 1, new_h)).astype(np.int32)
    x_idx = (np.linspace(0, width - 1, new_w)).astype(np.int32)
    return image[y_idx][:, x_idx]


# One confident glyph scores about 1.0 (confidence × characters). A single glyph
# is not enough to choose among quarter turns: an upside-down "A" tied 90° with 180°.
_LOW_TEXT_SCORE_FLOOR = 2.0


def _projection_sideways_hint(image: PageImage) -> bool:
    """True when vertical structure dominates — a page scanned on its side.

    Upside-down text stays horizontal, so this hint never separates 0° from 180°.
    """
    gray = image.mean(axis=2) if image.ndim == 3 else image.astype(np.float64)
    row_energy = float(np.var(gray.mean(axis=1)))
    col_energy = float(np.var(gray.mean(axis=0)))
    if row_energy <= 1e-9 and col_energy <= 1e-9:
        return False
    return col_energy > row_energy * 1.35


def _score_at(
    probe: PageImage,
    turns: QuarterTurns,
    ocr_score: Callable[[PageImage], float],
) -> float:
    rotated = probe if turns == 0 else rotate_image_cw(probe, turns)
    return float(ocr_score(rotated))


def _best_turn(scores: dict[QuarterTurns, float]) -> tuple[QuarterTurns, float]:
    best_turns: QuarterTurns = min(scores)
    best_score = scores[best_turns]
    for turns, score in scores.items():
        if score > best_score:
            best_score = score
            best_turns = turns
    return best_turns, best_score


def score_ocr_orientation(
    image: PageImage,
    ocr_score: Callable[[PageImage], float],
) -> QuarterTurns:
    """Pick 0/90/180/270 clockwise turns from a recognition score.

    Horizontal pages compare 0° with 180°. Sideways pages compare 90° with 270°.
    A positive score on the scanned pixels is not treated as upright, because
    upside-down text is still a horizontal band. The other axis is scored only
    when the chosen axis is below the low-text floor. Ties keep the smallest turn.
    A known turn uses ``orient_page_for_ocr(forced_quarter_turns_cw=...)``.
    """
    probe = _downsample(image)
    primary: tuple[QuarterTurns, ...] = (1, 3) if _projection_sideways_hint(probe) else (0, 2)
    scores = {turns: _score_at(probe, turns, ocr_score) for turns in primary}
    best_turns, best_score = _best_turn(scores)
    if best_score < _LOW_TEXT_SCORE_FLOOR:
        for turns in (0, 1, 2, 3):
            if turns not in scores:
                scores[turns] = _score_at(probe, turns, ocr_score)
        best_turns, best_score = _best_turn(scores)
        if best_score < _LOW_TEXT_SCORE_FLOOR:
            return 0
    return best_turns


def orient_page_for_ocr(
    image: PageImage,
    ocr_score: Callable[[PageImage], float] | None = None,
    *,
    forced_quarter_turns_cw: QuarterTurns | None = None,
) -> OrientedPage:
    if forced_quarter_turns_cw is not None:
        turns = int(forced_quarter_turns_cw) % 4
        return OrientedPage(image=rotate_image_cw(image, turns), quarter_turns_cw=turns)
    if ocr_score is None:
        return OrientedPage(image=image, quarter_turns_cw=0)
    turns = score_ocr_orientation(image, ocr_score)
    return OrientedPage(image=rotate_image_cw(image, turns), quarter_turns_cw=turns)
