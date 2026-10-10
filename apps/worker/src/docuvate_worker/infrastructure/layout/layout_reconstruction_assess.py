# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Heuristic and SSIM-based layout reconstruction fidelity for API/extract paths."""

from __future__ import annotations

import base64
import io
import re

from pypdf import PdfReader

from docuvate_worker.domain.layout_ir import LayoutIrDocument
from docuvate_worker.infrastructure.layout.extract_scanned import pdf_likely_scanned
from docuvate_worker.infrastructure.layout.font_map import typst_font_and_scale
from docuvate_worker.infrastructure.layout.layout_reconstruction_eval import (
    DEFAULT_COMPARE_DPI,
    LayoutReconstructionEval,
    ReconstructionUnreliableReason,
    evaluate_layout_ir_typst_reconstruction,
)

# Scripts that Typst/Liberation cannot faithfully reproduce today.
_ARABIC = re.compile(r"[\u0600-\u06FF\u0750-\u077F]")
_HEBREW = re.compile(r"[\u0590-\u05FF]")
_CJK = re.compile(r"[\u3040-\u30FF\u3400-\u9FFF\uF900-\uFAFF]")

_DEFAULT_API_SSIM_FLOOR = 0.90


def decode_optional_pdf(original_pdf_base64: str | None) -> bytes | None:
    if not original_pdf_base64:
        return None
    try:
        return base64.b64decode(original_pdf_base64, validate=True)
    except (ValueError, TypeError):
        return None


def _iter_block_text(doc: LayoutIrDocument | None) -> str:
    if doc is None:
        return ""
    parts: list[str] = []
    for page in doc.pages:
        for block in page.blocks:
            parts.append(block.text)
    return "\n".join(parts)


def _pdf_plain_text(content: bytes, *, max_pages: int = 10) -> str:
    try:
        reader = PdfReader(io.BytesIO(content))
        parts: list[str] = []
        for page in reader.pages[:max_pages]:
            parts.append(page.extract_text() or "")
        return "\n".join(parts)
    except Exception:
        return ""


def detect_unsupported_script(text: str) -> ReconstructionUnreliableReason | None:
    if _ARABIC.search(text):
        return ReconstructionUnreliableReason.UNSUPPORTED_SCRIPT
    if _HEBREW.search(text):
        return ReconstructionUnreliableReason.UNSUPPORTED_SCRIPT
    if _CJK.search(text):
        return ReconstructionUnreliableReason.UNSUPPORTED_SCRIPT
    return None


def has_unknown_pdf_font(doc: LayoutIrDocument) -> bool:
    for page in doc.pages:
        for block in page.blocks:
            name = block.font_family
            if not name:
                continue
            if typst_font_and_scale(name) == typst_font_and_scale("Helvetica"):
                if name and "helvetica" not in name.lower() and "arial" not in name.lower():
                    if "+" in name or "subset" in name.lower() or "dejavu" in name.lower():
                        return True
    return False


def assess_layout_reconstruction(
    doc: LayoutIrDocument | None,
    original_pdf: bytes | None,
    *,
    fixture_id: str = "document",
    category: str = "born_digital_standard",
    ssim_floor: float | None = None,
) -> LayoutReconstructionEval:
    """Return fidelity summary; never raises."""
    combined = _iter_block_text(doc)
    if original_pdf is not None:
        combined = f"{combined}\n{_pdf_plain_text(original_pdf)}"
    script = detect_unsupported_script(combined)
    if script is not None:
        return LayoutReconstructionEval(
            category=category,
            fixture_id=fixture_id,
            pages=(),
            aggregate_ssim=None,
            reconstruction_reliable=False,
            unreliable_reason=script,
            detail="Document uses a script not supported for exact Typst reconstruction",
        )

    if original_pdf is not None and pdf_likely_scanned(original_pdf):
        if len(combined.strip()) < 20:  # noqa: PLR2004
            return LayoutReconstructionEval(
                category=category,
                fixture_id=fixture_id,
                pages=(),
                aggregate_ssim=None,
                reconstruction_reliable=False,
                unreliable_reason=ReconstructionUnreliableReason.SCAN_WITHOUT_TEXT_LAYER,
                detail="Scanned PDF without sufficient text layer for layout IR",
            )

    if doc is None or not doc.pages:
        if original_pdf is not None and pdf_likely_scanned(original_pdf):
            return LayoutReconstructionEval(
                category=category,
                fixture_id=fixture_id,
                pages=(),
                aggregate_ssim=None,
                reconstruction_reliable=False,
                unreliable_reason=ReconstructionUnreliableReason.SCAN_WITHOUT_TEXT_LAYER,
                detail="Scanned PDF without sufficient text layer for layout IR",
            )
        return LayoutReconstructionEval(
            category=category,
            fixture_id=fixture_id,
            pages=(),
            aggregate_ssim=None,
            reconstruction_reliable=False,
            unreliable_reason=ReconstructionUnreliableReason.EXTRACTION_FAILED,
            detail="Layout IR extraction returned no pages",
        )

    if original_pdf is None:
        return LayoutReconstructionEval(
            category=category,
            fixture_id=fixture_id,
            pages=(),
            aggregate_ssim=None,
            reconstruction_reliable=True,
            unreliable_reason=None,
            detail=None,
        )

    floor = ssim_floor if ssim_floor is not None else _DEFAULT_API_SSIM_FLOOR
    return evaluate_layout_ir_typst_reconstruction(
        original_pdf,
        doc,
        category=category,
        fixture_id=fixture_id,
        ssim_floor=floor,
        dpi=DEFAULT_COMPARE_DPI,
    )
