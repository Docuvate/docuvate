"""Attach reconstruction fidelity metadata to layout HTML/Typst render responses."""

from __future__ import annotations

import base64

from docuvate_worker.domain.layout_ir import LayoutIrDocument
from docuvate_worker.infrastructure.layout.layout_reconstruction_assess import (
    assess_layout_reconstruction,
)
from docuvate_worker.infrastructure.layout.layout_reconstruction_eval import (
    LayoutReconstructionEval,
)


def decode_optional_pdf(original_pdf_base64: str | None) -> bytes | None:
    if not original_pdf_base64:
        return None
    try:
        return base64.b64decode(original_pdf_base64, validate=True)
    except (ValueError, TypeError):
        return None


def fidelity_for_layout_render(
    doc: LayoutIrDocument,
    original_pdf: bytes | None,
) -> LayoutReconstructionEval:
    return assess_layout_reconstruction(
        doc,
        original_pdf,
        fixture_id="render",
        category="born_digital_standard",
    )
