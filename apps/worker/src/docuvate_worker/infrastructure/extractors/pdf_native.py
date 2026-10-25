# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import io
import os

from docuvate_worker.domain.extraction_geometry import (
    PageDimensions,
    extraction_block_from_absolute,
    extraction_block_from_normalized,
)
from docuvate_worker.domain.models import ExtractionBlock

_DEFAULT_MIN_CHARS = 80
_MAX_NATIVE_WORD_BLOCKS = 2_500


def pdf_native_min_chars() -> int:
    raw = os.environ.get("PDF_NATIVE_MIN_CHARS", str(_DEFAULT_MIN_CHARS))
    try:
        return max(0, int(raw))
    except ValueError:
        return _DEFAULT_MIN_CHARS


def try_extract_pdf_native(content: bytes) -> tuple[str, list[ExtractionBlock]] | None:
    """Extract text + word boxes from born-digital PDFs (no OCR)."""
    import pdfplumber  # noqa: PLC0415

    try:
        pdf_stream = io.BytesIO(content)
        pdf_handle = pdfplumber.open(pdf_stream)
    except Exception:
        return None

    page_texts: list[str] = []
    blocks: list[ExtractionBlock] = []
    block_index = 0

    try:
        with pdf_handle as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                page_text = (page.extract_text() or "").strip()
                page_texts.append(page.extract_text() or "")

                width = float(page.width or 0)
                height = float(page.height or 0)
                if width <= 0 or height <= 0:
                    continue

                words = page.extract_words() or []
                page_size = PageDimensions(width=width, height=height)
                if not words and page_text:
                    fallback = extraction_block_from_normalized(
                        page=page_num,
                        x=0.05,
                        y=0.05,
                        width=0.9,
                        height=0.1,
                        text=page_text[:500],
                        block_index=block_index,
                    )
                    if fallback is not None:
                        blocks.append(fallback)
                        block_index += 1
                    continue

                for word in words:
                    if block_index >= _MAX_NATIVE_WORD_BLOCKS:
                        break
                    text = (word.get("text") or "").strip()
                    if not text:
                        continue
                    x0 = float(word["x0"])
                    x1 = float(word["x1"])
                    top = float(word["top"])
                    bottom = float(word["bottom"])
                    block = extraction_block_from_absolute(
                        page=page_num,
                        x0=x0,
                        y0=top,
                        x1=x1,
                        y1=bottom,
                        page_size=page_size,
                        text=text,
                        block_index=block_index,
                    )
                    if block is None:
                        continue
                    blocks.append(block)
                    block_index += 1
                if block_index >= _MAX_NATIVE_WORD_BLOCKS:
                    if page_text:
                        fallback = extraction_block_from_normalized(
                            page=page_num,
                            x=0.05,
                            y=0.05,
                            width=0.9,
                            height=0.9,
                            text=page_text[:4000],
                            block_index=block_index,
                        )
                        if fallback is not None:
                            blocks.append(fallback)
                            block_index += 1
                    break
    except Exception:
        return None

    full_text = "\n\n".join(page_texts).strip()
    if len(full_text) < pdf_native_min_chars():
        return None
    return full_text, blocks
