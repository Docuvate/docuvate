"""Produce layout IR alongside extraction results."""

from __future__ import annotations

from docuvate_worker.domain.layout_ir import LayoutIrDocument
from docuvate_worker.domain.models import ExtractionBlock
from docuvate_worker.infrastructure.layout.anchors import anchor_layout_to_extraction_blocks
from docuvate_worker.infrastructure.layout.extract import extract_layout_pdf_bytes
from docuvate_worker.infrastructure.layout.extract_scanned import pdf_likely_scanned
from docuvate_worker.infrastructure.layout.from_blocks import layout_ir_from_extraction_blocks
from docuvate_worker.infrastructure.layout.pdf_page_size import (
    image_size_pt_from_pixels,
    pdf_first_page_size_pt,
    pdf_page_sizes_pt,
)


def build_layout_ir(
    content: bytes,
    mime_type: str,
    blocks: list[ExtractionBlock] | None,
) -> LayoutIrDocument | None:
    doc: LayoutIrDocument | None = None
    if mime_type == "application/pdf" and not pdf_likely_scanned(content):
        doc = extract_layout_pdf_bytes(content)
    if doc is None and blocks:
        page_sizes: dict[int, tuple[float, float]] | None = None
        width_pt, height_pt = 612.0, 792.0
        if mime_type == "application/pdf":
            page_sizes = pdf_page_sizes_pt(content)
            width_pt, height_pt = pdf_first_page_size_pt(content)
        elif mime_type.startswith("image/"):
            try:
                import io as _io

                from PIL import Image

                with Image.open(_io.BytesIO(content)) as im:
                    dpi = im.info.get("dpi")
                    dpi_x = (
                        float(dpi[0]) if isinstance(dpi, (tuple, list)) and len(dpi) >= 1 else None
                    )
                    dpi_y = (
                        float(dpi[1]) if isinstance(dpi, (tuple, list)) and len(dpi) >= 2 else None
                    )
                    width_pt, height_pt = image_size_pt_from_pixels(
                        im.width, im.height, dpi_x=dpi_x, dpi_y=dpi_y
                    )
            except Exception:
                width_pt, height_pt = 612.0, 792.0
        doc = layout_ir_from_extraction_blocks(
            blocks,
            width_pt=width_pt,
            height_pt=height_pt,
            page_sizes_pt=page_sizes,
        )
    if doc is None:
        return None
    return anchor_layout_to_extraction_blocks(doc, blocks)
