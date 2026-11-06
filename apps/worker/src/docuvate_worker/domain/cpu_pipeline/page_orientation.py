# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Orient a page image before OCR and map boxes back to the unrotated MediaBox."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

import numpy as np

QuarterTurns = int  # 0..3 clockwise


@dataclass(frozen=True)
class OrientedPage:
    """Page raster ready for OCR plus the clockwise quarter turns applied to the source."""

    image: np.ndarray
    quarter_turns_cw: QuarterTurns


def rotate_image_cw(image: np.ndarray, quarter_turns_cw: QuarterTurns) -> np.ndarray:
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
        # OCR was on 90° CW image: OCR(x,y) ← src(y, 1-x)  ⇒ src ← (1-y_ocr, x_ocr)
        sx0, sy0 = 1.0 - y1, x0
        sx1, sy1 = 1.0 - y0, x1
    elif turns == 2:
        sx0, sy0 = 1.0 - x1, 1.0 - y1
        sx1, sy1 = 1.0 - x0, 1.0 - y0
    else:
        # 270° CW / 90° CCW: OCR(x,y) ← src(1-y, x) ⇒ src ← (y_ocr, 1-x_ocr)
        sx0, sy0 = y0, 1.0 - x1
        sx1, sy1 = y1, 1.0 - x0
    nx0, nx1 = sorted((sx0, sx1))
    ny0, ny1 = sorted((sy0, sy1))
    nx0 = min(1.0, max(0.0, nx0))
    ny0 = min(1.0, max(0.0, ny0))
    nx1 = min(1.0, max(0.0, nx1))
    ny1 = min(1.0, max(0.0, ny1))
    return nx0, ny0, max(0.0, nx1 - nx0), max(0.0, ny1 - ny0)


def _downsample(image: np.ndarray, max_side: int = 512) -> np.ndarray:
    height, width = image.shape[:2]
    scale = min(1.0, float(max_side) / float(max(height, width)))
    if scale >= 0.999:
        return image
    new_w = max(1, int(round(width * scale)))
    new_h = max(1, int(round(height * scale)))
    # Nearest-neighbour via slicing strides — avoid a hard OpenCV dependency here.
    y_idx = (np.linspace(0, height - 1, new_h)).astype(np.int32)
    x_idx = (np.linspace(0, width - 1, new_w)).astype(np.int32)
    return image[y_idx][:, x_idx]


def _projection_sideways_hint(image: np.ndarray) -> bool:
    """True when vertical structure dominates — typical of a page scanned on its side."""
    if image.ndim == 3:
        gray = image.mean(axis=2)
    else:
        gray = image.astype(np.float64)
    row_energy = float(np.var(gray.mean(axis=1)))
    col_energy = float(np.var(gray.mean(axis=0)))
    if row_energy <= 1e-9 and col_energy <= 1e-9:
        return False
    return col_energy > row_energy * 1.35


def score_ocr_orientation(
    image: np.ndarray,
    ocr_score: Callable[[np.ndarray], float],
) -> QuarterTurns:
    """Pick the clockwise quarter turn that maximises a cheap OCR score on a downscaled page.

    Clearly upright pages (horizontal text bands) stay at 0 without trying every rotation.
    Sideways-looking pages compare 90° and 270° (and 0/180 when the signal is weak).
    """
    probe = _downsample(image)
    upright_score = ocr_score(probe)
    if not _projection_sideways_hint(probe) and upright_score > 0.0:
        return 0
    candidates: tuple[QuarterTurns, ...]
    if _projection_sideways_hint(probe):
        candidates = (0, 1, 3)
    else:
        candidates = (0, 1, 2, 3)
    best_turns: QuarterTurns = 0
    best_score = float("-inf")
    for turns in candidates:
        rotated = probe if turns == 0 else rotate_image_cw(probe, turns)
        score = upright_score if turns == 0 else ocr_score(rotated)
        if score > best_score or (score == best_score and turns == 0):
            best_score = score
            best_turns = turns
    return best_turns


def orient_page_for_ocr(
    image: np.ndarray,
    ocr_score: Callable[[np.ndarray], float] | None = None,
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
