# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class LayoutCompareSummary:
    category: str
    ssim_floor: float
    page_count: int


@dataclass(frozen=True)
class LayoutPageMetric:
    page_number: int
    ssim: float | None
    ink_deviation: float | None
    page_reliable: bool
    error_code: str | None


@dataclass(frozen=True)
class LayoutPageMetricsBatch:
    category: str
    ssim_floor: float
    page_count: int
    pages: tuple[LayoutPageMetric, ...]


@dataclass(frozen=True)
class LayoutPageComparePayload:
    page_number: int
    ssim: float | None
    ink_deviation: float | None
    ssim_floor: float
    page_reliable: bool
    width_px: int
    height_px: int
    original_png_base64: str
    reconstruction_png_base64: str
    heatmap_png_base64: str | None
    error_code: str | None
