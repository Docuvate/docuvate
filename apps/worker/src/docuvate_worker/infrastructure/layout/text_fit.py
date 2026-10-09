# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Estimate horizontal scale so rendered text matches PDF word bbox width."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from PIL import ImageFont


def horizontal_scale_factor(
    text: str,
    font_size_pt: float,
    target_width_pt: float,
    *,
    bold: bool = False,
    estimated_width_pt: float | None = None,
) -> float:
    stripped = text.rstrip()
    if not stripped or target_width_pt <= 0 or font_size_pt <= 0:
        return 1.0
    if estimated_width_pt is not None and estimated_width_pt > 0:
        estimated = estimated_width_pt
    else:
        # Liberation bold runs wider than 0.48em vs PDF Frutiger bbox — bias high, then shrink only.
        em = 0.62 if bold else 0.5
        estimated = len(stripped) * font_size_pt * em
    if estimated <= 0:
        return 1.0
    scale = target_width_pt / estimated
    return max(0.85, min(1.15, scale))


@lru_cache(maxsize=8)
def _liberation_font_path(family: str, bold: bool) -> str | None:
    suffix = "Bold" if bold else "Regular"
    name = family.replace(" ", "")
    candidates = [
        Path(f"/usr/share/fonts/truetype/liberation/{name}-{suffix}.ttf"),
        Path(f"/usr/share/fonts/liberation/{name}-{suffix}.ttf"),
    ]
    for path in candidates:
        if path.is_file():
            return str(path)
    return None


def measured_text_width_pt(
    text: str,
    font_size_pt: float,
    typst_family: str,
    *,
    bold: bool = False,
) -> float | None:
    stripped = text.rstrip()
    if not stripped or font_size_pt <= 0:
        return None
    font_path = _liberation_font_path(typst_family, bold)
    if font_path is None:
        return None
    try:
        font = ImageFont.truetype(font_path, size=max(1, int(round(font_size_pt))))
    except OSError:
        return None
    bbox = font.getbbox(stripped)
    if bbox is None:
        return None
    return float(bbox[2] - bbox[0])
