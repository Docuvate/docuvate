# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""High-DPI scanned PDFs with dense public-domain text (US Constitution excerpts)."""

from __future__ import annotations

import io
import random
from pathlib import Path

from pypdf import PdfReader, PdfWriter

from tests.synthetic_scan_pdfs import _build_scan_pdf

_CONSTITUTION_EXCERPT = (
    Path(__file__).resolve().parent / "fixtures" / "public_scans" / "us_constitution_excerpt.txt"
)


def _constitution_lines() -> list[str]:
    if _CONSTITUTION_EXCERPT.is_file():
        raw = _CONSTITUTION_EXCERPT.read_text(encoding="utf-8")
    else:
        raw = (
            "We the People of the United States, in Order to form a more perfect Union, "
            "establish Justice, insure domestic Tranquility, provide for the common defence, "
            "promote the general Welfare, and secure the Blessings of Liberty to ourselves "
            "and our Posterity, do ordain and establish this Constitution for the United States "
            "of America."
        )
    words = raw.replace("\n", " ").split()
    lines: list[str] = []
    chunk: list[str] = []
    for word in words:
        chunk.append(word)
        if len(chunk) >= 12:
            lines.append(" ".join(chunk))
            chunk = []
    if chunk:
        lines.append(" ".join(chunk))
    return lines


def public_domain_dense_scan_pdf(
    page_count: int,
    *,
    dpi: int = 300,
    seed: int = 7,
) -> bytes:
    """Multi-page image-only scan with many lines per page (memory stress)."""
    if page_count < 1:
        raise ValueError("page_count must be >= 1")
    base_lines = _constitution_lines()
    rng = random.Random(seed)
    writer = PdfWriter()
    for page_index in range(page_count):
        y = 720.0
        page_lines: list[tuple[str, float, float, int]] = []
        for line_no in range(18):
            text = base_lines[(page_index + line_no) % len(base_lines)]
            page_lines.append((f"P{page_index + 1} L{line_no + 1}: {text}", 36.0, y, 9))
            y -= 16.0
            if y < 48.0:
                break
        page_pdf = _build_scan_pdf(
            page_lines,
            include_text_layer=False,
            dpi=dpi,
        )
        reader = PdfReader(io.BytesIO(page_pdf))
        writer.add_page(reader.pages[0])
        rng.randint(0, 1)
    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()
