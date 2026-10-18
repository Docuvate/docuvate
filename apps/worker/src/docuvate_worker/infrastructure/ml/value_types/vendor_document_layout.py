# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import math

from docuvate_worker.infrastructure.ml.value_types.model import ValueTypeModelBundle


def _split_label_value(line: str) -> tuple[str, str | None]:
    if ":" not in line:
        return line, None
    head, tail = line.split(":", 1)
    if not head.strip() or not tail.strip():
        return line, None
    return head, tail.strip()


def letterhead_band_ratio(line_index: int, line_count: int) -> float:
    """1.0 at the top line, decays toward 0 by ~25% of the document."""
    if line_count <= 1:
        return 1.0
    band = max(2, math.ceil(line_count * 0.25))
    if line_index >= band:
        return 0.0
    return 1.0 - (line_index / max(1, band - 1))


def footer_band_ratio(line_index: int, line_count: int) -> float:
    """1.0 on the last line, decays upward over the bottom ~25%."""
    if line_count <= 1:
        return 1.0
    band = max(2, math.ceil(line_count * 0.25))
    start = max(0, line_count - band)
    if line_index < start:
        return 0.0
    return (line_index - start + 1) / max(1, band)


def _line_org_text(line: str) -> str:
    _, value_part = _split_label_value(line)
    return value_part if value_part is not None else line.strip()


def cross_block_supplier_agreement(
    *,
    lines: list[str],
    line_index: int,
    supplier_cosines: list[float],
    bundle: ValueTypeModelBundle,
) -> float:
    """Max supplier-role E5 among org-like lines in letterhead/footer bands."""
    line_count = len(lines)
    letterhead_end = max(1, math.ceil(line_count * 0.25))
    footer_start = max(0, line_count - max(1, math.ceil(line_count * 0.25)))
    best = 0.0
    for index, line in enumerate(lines):
        if index == line_index:
            continue
        if index >= letterhead_end and index < footer_start:
            continue
        text = _line_org_text(line)
        if not text:
            continue
        org = bundle.log_likelihood(text, "organization")
        free = bundle.log_likelihood(text, "free_text")
        if org <= free:
            continue
        best = max(best, supplier_cosines[index])
    return best


def iban_holder_adjacency_hint(
    *,
    lines: list[str],
    line_index: int,
    bundle: ValueTypeModelBundle,
) -> float:
    """Org line adjacent to a strong identifier line in footer / payment blocks."""
    line_count = len(lines)
    footer_start = max(0, line_count - max(2, math.ceil(line_count * 0.3)))
    best = 0.0
    for index in range(max(0, line_index - 2), min(line_count, line_index + 3)):
        if index < footer_start and index > 2:  # noqa: PLR2004
            continue
        line = lines[index].strip()
        if not line:
            continue
        ident = bundle.log_likelihood(line, "identifier")
        free = bundle.log_likelihood(line, "free_text")
        if ident <= free:
            continue
        for neighbor in (index - 1, index + 1):
            if neighbor < 0 or neighbor >= line_count:
                continue
            text = _line_org_text(lines[neighbor])
            if not text:
                continue
            org = bundle.log_likelihood(text, "organization")
            org_free = bundle.log_likelihood(text, "free_text")
            if org > org_free:
                best = max(best, min(1.0, (ident - free) / 40.0))
    return best
