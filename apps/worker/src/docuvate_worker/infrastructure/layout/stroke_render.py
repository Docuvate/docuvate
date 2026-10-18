# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Map PDF stroke widths to HTML/SVG widths that match pdf2image hairlines at raster DPI."""

from __future__ import annotations

# Layout preview raster DPI (hairline width in SVG user space).
_LAYOUT_RASTER_DPI = 144

# One output pixel at our fidelity DPI, in typographic points (SVG user space).
_HAIRLINE_PT = 72.0 / _LAYOUT_RASTER_DPI


def stroke_width_pt_for_render(linewidth_pt: float) -> float:
    """Cap thick pdfplumber defaults so HTML raster matches Poppler/pdf2image (~1px)."""
    if linewidth_pt <= 0:
        return _HAIRLINE_PT
    return min(float(linewidth_pt), _HAIRLINE_PT * 1.05)
