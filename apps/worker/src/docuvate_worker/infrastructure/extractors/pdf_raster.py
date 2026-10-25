# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Rasterize PDF pages one at a time to bound peak memory."""

from __future__ import annotations

from collections.abc import Iterator

from pdf2image import convert_from_bytes
from PIL import Image


def iter_pdf_page_images(
    content: bytes,
    *,
    dpi: int = 200,
    max_pages: int | None = None,
) -> Iterator[tuple[int, Image.Image]]:
    page_num = 1
    while True:
        if max_pages is not None and page_num > max_pages:
            return
        try:
            batch = convert_from_bytes(
                content,
                dpi=dpi,
                first_page=page_num,
                last_page=page_num,
            )
        except Exception:
            return
        if not batch:
            return
        try:
            yield page_num, batch[0]
        finally:
            for extra in batch[1:]:
                extra.close()
        page_num += 1
