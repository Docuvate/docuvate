# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Infer layout SSIM catalog category for per-page fidelity thresholds."""

from __future__ import annotations

import io

from pypdf import PdfReader

from docuvate_worker.domain.layout_ir import LayoutIrDocument
from docuvate_worker.infrastructure.layout.extract_scanned import pdf_likely_scanned
from docuvate_worker.infrastructure.layout.layout_reconstruction_assess import (
    detect_unsupported_script,
)


def _pdf_plain_text(content: bytes, *, max_pages: int = 10) -> str:
    try:
        reader = PdfReader(io.BytesIO(content))
        parts: list[str] = []
        for page in reader.pages[:max_pages]:
            parts.append(page.extract_text() or "")
        return "\n".join(parts)
    except Exception:
        return ""


def _layout_block_text(doc: LayoutIrDocument) -> str:
    parts: list[str] = []
    for page in doc.pages:
        for block in page.blocks:
            parts.append(block.text)
    return "\n".join(parts)


def infer_layout_ssim_category(doc: LayoutIrDocument, original_pdf: bytes) -> str:
    combined = f"{_layout_block_text(doc)}\n{_pdf_plain_text(original_pdf)}"
    if detect_unsupported_script(combined) is not None:
        return "non_latin"
    if pdf_likely_scanned(original_pdf):
        return "scanned_text_layer"
    if len(doc.pages) > 1:
        return "multi_page"
    if doc.pages:
        first = doc.pages[0]
        if first.height_pt > 0 and first.width_pt > first.height_pt * 1.05:
            return "landscape"
    for page in doc.pages:
        for block in page.blocks:
            rotation = block.rotation_deg
            if rotation is not None and abs(rotation) > 2.0:  # noqa: PLR2004
                return "rotated"
    for page in doc.pages:
        if page.tables:
            return "table_grid"
    return "born_digital_standard"
