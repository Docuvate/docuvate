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
    # Top-left of a 90° clockwise OCR image is the bottom-left of the source.
    x, y, w, h = map_norm_box_to_unrotated(0.0, 0.0, 0.1, 0.2, 1)
    assert abs(x - 0.0) < 1e-9
    assert abs(y - 0.9) < 1e-9
    assert abs(w - 0.2) < 1e-9
    assert abs(h - 0.1) < 1e-9


def test_score_prefers_upright_on_tie() -> None:
    image = np.zeros((32, 32, 3), dtype=np.uint8)

    def flat(_arr: np.ndarray) -> float:
        return 5.0

    assert score_ocr_orientation(image, flat) == 0


def test_low_text_does_not_guess_a_rotation() -> None:
    image = np.zeros((40, 80, 3), dtype=np.uint8)

    def weak(arr: np.ndarray) -> float:
        return 1.5 if arr.shape[0] > arr.shape[1] else 0.4

    assert score_ocr_orientation(image, weak) == 0


def test_upside_down_is_compared_when_native_score_is_positive() -> None:
    image = np.zeros((80, 160, 3), dtype=np.uint8)
    image[60:72, 20:140] = 255

    def score(arr: np.ndarray) -> float:
        gray = arr.mean(axis=2)
        if float(gray[:10].mean()) > 20.0:
            return 8.0
        return 1.5

    assert score_ocr_orientation(image, score) == 2


def test_manual_override_does_not_call_the_scorer() -> None:
    image = np.zeros((8, 16, 3), dtype=np.uint8)

    def explode(_arr: np.ndarray) -> float:
        raise AssertionError("scorer must not run for an explicit turn")

    for forced in (0, 1, 2, 3):
        oriented = orient_page_for_ocr(image, explode, forced_quarter_turns_cw=forced)
        assert oriented.quarter_turns_cw == forced


def test_orient_forced() -> None:
    image = np.zeros((8, 16, 3), dtype=np.uint8)
    oriented = orient_page_for_ocr(image, forced_quarter_turns_cw=1)
    assert oriented.quarter_turns_cw == 1
    assert oriented.image.shape[:2] == (16, 8)


def test_map_box_inverts_clockwise_raster_rotation() -> None:
    """OCR-space box (x,y,w,h) → source raster (x,y,w,h) for every quarter turn."""
    cases = [
        # turns, ocr (x,y,w,h), expected source (x,y,w,h)
        (0, (0.1, 0.2, 0.2, 0.2), (0.1, 0.2, 0.2, 0.2)),
        (1, (0.0, 0.0, 0.1, 0.2), (0.0, 0.9, 0.2, 0.1)),
        (2, (0.1, 0.2, 0.3, 0.4), (0.6, 0.4, 0.3, 0.4)),
        (3, (0.0, 0.0, 0.1, 0.2), (0.8, 0.0, 0.2, 0.1)),
    ]
    for turns, ocr, expected in cases:
        got = map_norm_box_to_unrotated(*ocr, turns)
        for a, b in zip(got, expected, strict=True):
            assert abs(a - b) < 1e-9, (turns, got, expected)


def test_mapped_box_covers_the_rotated_pixel() -> None:
    image = np.zeros((40, 80, 3), dtype=np.uint8)
    image[10, 20] = (255, 0, 0)
    src_x = 20.5 / 80
    src_y = 10.5 / 40
    for turns in (0, 1, 2, 3):
        rotated = rotate_image_cw(image, turns)
        rows, cols = np.nonzero(rotated[:, :, 0] == 255)
        assert len(rows) == 1
        height, width = rotated.shape[:2]
        mapped = map_norm_box_to_unrotated(
            float(cols[0]) / width,
            float(rows[0]) / height,
            1.0 / width,
            1.0 / height,
            turns,
        )
        assert mapped[0] <= src_x <= mapped[0] + mapped[2]
        assert mapped[1] <= src_y <= mapped[1] + mapped[3]


def test_orient_page_scores_sideways_hint() -> None:
    """Vertical structure (sideways scan) plus a portrait-preferring scorer picks 90°/270°."""
    image = np.zeros((40, 80, 3), dtype=np.uint8)
    # Strong column variance → projection sideways hint.
    image[:, 10:14] = 255
    image[:, 40:44] = 255
    image[:, 70:74] = 255

    def score(arr: np.ndarray) -> float:
        h, w = arr.shape[:2]
        return 2.0 if h > w else 0.1

    oriented = orient_page_for_ocr(image, score)
    assert oriented.quarter_turns_cw in (1, 3)
    assert oriented.image.shape[0] > oriented.image.shape[1]


def _vertical_bars() -> np.ndarray:
    image = np.zeros((40, 80, 3), dtype=np.uint8)
    image[:, 10:14] = 255
    image[:, 40:44] = 255
    image[:, 70:74] = 255
    return image


def test_sideways_page_rotates_when_the_native_score_is_under_the_floor() -> None:
    """A sideways winner above 2.0 is kept even when the unrotated score is under 2.0."""
    image = _vertical_bars()

    def score(arr: np.ndarray) -> float:
        height, width = arr.shape[:2]
        return 4.0 if height > width else 0.4

    assert score(image) < 2.0
    assert score_ocr_orientation(image, score) in (1, 3)


def test_sideways_page_under_the_floor_stays_upright() -> None:
    image = _vertical_bars()

    def score(arr: np.ndarray) -> float:
        height, width = arr.shape[:2]
        return 1.4 if height > width else 0.2

    assert score_ocr_orientation(image, score) == 0


def test_ambiguous_no_text_under_the_floor_stays_upright() -> None:
    image = np.zeros((48, 64, 3), dtype=np.uint8)

    def score(arr: np.ndarray) -> float:
        height, width = arr.shape[:2]
        if height == image.shape[0] and width == image.shape[1]:
            return 1.2
        return 0.3

    assert score_ocr_orientation(image, score) == 0
