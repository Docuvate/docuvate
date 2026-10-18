# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Heuristics for born-digital vs scanned PDFs (no OCR here)."""

from __future__ import annotations

import io

_MIN_CHARS_FOR_BORN_DIGITAL = 20
_MIN_WORDS_FOR_BORN_DIGITAL = 8


def pdf_likely_scanned(content: bytes, *, sample_pages: int = 3) -> bool:
    import pdfplumber  # noqa: PLC0415

    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            pages = pdf.pages[:sample_pages]
            if not pages:
                return True
            char_count = 0
            word_count = 0
            for page in pages:
                char_count += len(page.chars or [])
                word_count += len(page.extract_words() or [])
            sparse_chars = char_count < _MIN_CHARS_FOR_BORN_DIGITAL
            sparse_words = word_count < _MIN_WORDS_FOR_BORN_DIGITAL
            if sparse_chars and sparse_words:
                return True
    except Exception:
        return True
    return False
