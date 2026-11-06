# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import numpy as np

from docuvate_worker.domain.cpu_pipeline.page_orientation import (
    map_norm_box_to_unrotated,
    orient_page_for_ocr,
    rotate_image_cw,
    score_ocr_orientation,
)


def test_rotate_image_cw_swaps_axes() -> None:
    image = np.zeros((10, 20, 3), dtype=np.uint8)
    image[0, 0] = (1, 2, 3)
    rotated = rotate_image_cw(image, 1)
    assert rotated.shape[:2] == (20, 10)
    # Source (0,0) lands at top-right of 90° CW image → (0, last_col) in image coords...
    # np.rot90(k=-1) maps [r,c] → [c, H-1-r]
    assert tuple(rotated[0, 9]) == (1, 2, 3)


def test_map_box_identity() -> None:
    assert map_norm_box_to_unrotated(0.1, 0.2, 0.3, 0.4, 0) == (0.1, 0.2, 0.3, 0.4)


def test_map_box_90_cw_roundtrip_corner() -> None:
    # A box at top-left of the OCR (rotated) image came from bottom-left of source.
    x, y, w, h = map_norm_box_to_unrotated(0.0, 0.0, 0.1, 0.2, 1)
    assert abs(x - 0.8) < 1e-9  # 1 - 0.2
    assert abs(y - 0.0) < 1e-9
    assert abs(w - 0.2) < 1e-9
    assert abs(h - 0.1) < 1e-9


def test_score_prefers_upright_on_tie() -> None:
    image = np.zeros((32, 32, 3), dtype=np.uint8)

    def flat(_arr: np.ndarray) -> float:
        return 1.0

    assert score_ocr_orientation(image, flat) == 0


def test_orient_forced() -> None:
    image = np.zeros((8, 16, 3), dtype=np.uint8)
    oriented = orient_page_for_ocr(image, forced_quarter_turns_cw=1)
    assert oriented.quarter_turns_cw == 1
    assert oriented.image.shape[:2] == (16, 8)
