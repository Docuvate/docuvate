# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Map PDF font names to Typst families and optional size scale factors."""

from __future__ import annotations

import re

from docuvate_worker.domain.layout_ir import FontWeight

# (Typst family, size multiplier on font_size_pt)
_DEFAULT = ("Liberation Sans", 1.0)

_BOLD_HINT = re.compile(r"(bold|black|heavy|semibold)", re.I)
_ITALIC_HINT = re.compile(r"(italic|oblique)", re.I)


def weight_from_fontname(fontname: str | None) -> FontWeight:
    if not fontname:
        return FontWeight.NORMAL
    return FontWeight.BOLD if _BOLD_HINT.search(fontname) else FontWeight.NORMAL


def is_italic_fontname(fontname: str | None) -> bool:
    if not fontname:
        return False
    return bool(_ITALIC_HINT.search(fontname))

_PATTERNS: list[tuple[re.Pattern[str], tuple[str, float]]] = [
    (re.compile(r"times|nimbusrom|timesnewroman", re.I), ("Liberation Serif", 0.97)),
    (re.compile(r"courier|nimbusmono|liberationmono", re.I), ("Liberation Mono", 1.0)),
    (
        re.compile(r"helvetica|arial|liberationsans|univers|frutiger|calibri|verdana", re.I),
        ("Liberation Sans", 1.0),
    ),
    (re.compile(r"dejavu|docusubset", re.I), ("Liberation Sans", 1.0)),
    (re.compile(r"bundessans|ttnorms", re.I), ("Liberation Sans", 0.96)),
    (re.compile(r"serif|palatino|garamond|minion", re.I), ("Liberation Serif", 0.96)),
]


def font_ascent_em(fontname: str | None) -> float:
    """Cap-height / ascent ratio for baseline → top CSS placement."""
    family, _ = typst_font_and_scale(fontname)
    if family == "Liberation Sans":
        return 0.77
    if family == "Liberation Serif":
        return 0.72
    if family == "Liberation Mono":
        return 0.71
    return 0.76


def css_font_family(fontname: str | None) -> str:
    """Web stack aligned with typst_font_and_scale (sans default)."""
    family, _ = typst_font_and_scale(fontname)
    if family == "Liberation Sans":
        return '"Liberation Sans", "Helvetica Neue", Helvetica, Arial, sans-serif'
    if family == "Liberation Serif":
        return '"Liberation Serif", "Times New Roman", Times, serif'
    if family == "Liberation Mono":
        return '"Liberation Mono", "Courier New", Courier, monospace'
    return '"Liberation Sans", "Helvetica Neue", Helvetica, Arial, sans-serif'


def uses_metric_typst_substitute(fontname: str | None) -> bool:
    """True when PDF font maps to Typst with no horizontal scale fudge (e.g. Helvetica)."""
    if not fontname:
        return True
    for pattern, (family, mult) in _PATTERNS:
        if abs(mult - 1.0) > 0.001:
            continue
        if pattern.search(fontname):
            return family in ("Liberation Sans", "Liberation Mono")
    base = fontname.split("-")[0].split("+")[-1]
    if base:
        for pattern, (family, mult) in _PATTERNS:
            if abs(mult - 1.0) > 0.001:
                continue
            if pattern.search(base):
                return family in ("Liberation Sans", "Liberation Mono")
    return False


def typst_font_and_scale(fontname: str | None) -> tuple[str, float]:
    if not fontname:
        return _DEFAULT
    for pattern, mapped in _PATTERNS:
        if pattern.search(fontname):
            return mapped
    base = fontname.split("-")[0].split("+")[-1]
    if base:
        for pattern, mapped in _PATTERNS:
            if pattern.search(base):
                return mapped
    return _DEFAULT
