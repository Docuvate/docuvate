# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Env-backed limits for layout reconstruction compare."""

from __future__ import annotations

import os

from docuvate_worker.domain.layout_ir import LayoutIrDocument
from docuvate_worker.infrastructure.layout.layout_compare_errors import (
    CompareErrorCode,
    LayoutCompareError,
)


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None or not raw.strip():
        return default
    return int(raw)


MAX_PDF_BYTES = _env_int("LAYOUT_COMPARE_MAX_PDF_BYTES", 25 * 1024 * 1024)
MAX_PAGE_COUNT = _env_int("LAYOUT_COMPARE_MAX_PAGES", 120)
CACHE_MAX_BYTES = _env_int("LAYOUT_COMPARE_CACHE_MAX_BYTES", 64 * 1024 * 1024)
CACHE_MAX_ENTRY_BYTES = _env_int("LAYOUT_COMPARE_CACHE_MAX_ENTRY_BYTES", 8 * 1024 * 1024)
MAX_METRICS_BATCH = _env_int("LAYOUT_COMPARE_MAX_METRICS_BATCH", 25)
COMPARE_DEADLINE_SEC = _env_int("LAYOUT_COMPARE_DEADLINE_SEC", 90)


def page_count(doc: LayoutIrDocument) -> int:
    return len(doc.pages)


def validate_pdf_bytes(pdf: bytes) -> None:
    if len(pdf) > MAX_PDF_BYTES:
        raise LayoutCompareError(CompareErrorCode.PDF_TOO_LARGE)


def validate_document_pages(doc: LayoutIrDocument) -> None:
    count = page_count(doc)
    if count == 0:
        raise LayoutCompareError(CompareErrorCode.PAGE_OUT_OF_RANGE)
    if count > MAX_PAGE_COUNT:
        raise LayoutCompareError(CompareErrorCode.TOO_MANY_PAGES)


def validate_page_number(doc: LayoutIrDocument, page_number: int) -> None:
    if page_number < 1 or page_number > page_count(doc):
        raise LayoutCompareError(CompareErrorCode.PAGE_OUT_OF_RANGE)


def validate_metrics_page_batch(page_numbers: list[int], doc: LayoutIrDocument) -> list[int]:
    if not page_numbers:
        raise LayoutCompareError(CompareErrorCode.PAGE_OUT_OF_RANGE)
    if len(page_numbers) > MAX_METRICS_BATCH:
        raise LayoutCompareError(CompareErrorCode.TOO_MANY_PAGES)
    unique = sorted({p for p in page_numbers})
    for page_number in unique:
        validate_page_number(doc, page_number)
    return unique
