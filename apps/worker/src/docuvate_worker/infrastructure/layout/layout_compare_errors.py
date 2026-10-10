# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Stable error codes for layout compare (no internal exception text to clients)."""

from __future__ import annotations

import logging
from enum import StrEnum

logger = logging.getLogger(__name__)


class CompareErrorCode(StrEnum):
    COMPILE_FAILED = "compile_failed"
    RASTERIZE_FAILED = "rasterize_failed"
    PAGE_OUT_OF_RANGE = "page_out_of_range"
    PDF_TOO_LARGE = "pdf_too_large"
    TOO_MANY_PAGES = "too_many_pages"
    TIMEOUT = "timeout"
    COMPARE_FAILED = "compare_failed"


class LayoutCompareError(Exception):
    def __init__(self, code: CompareErrorCode, *, detail: str | None = None) -> None:
        super().__init__(code.value)
        self.code = code
        if detail:
            logger.warning("layout compare %s: %s", code.value, detail)


def map_exception_to_code(exc: BaseException) -> CompareErrorCode:
    if isinstance(exc, LayoutCompareError):
        return exc.code
    message = str(exc).lower()
    if "typst" in message:
        return CompareErrorCode.COMPILE_FAILED
    if "page" in message and "no page" in message:
        return CompareErrorCode.PAGE_OUT_OF_RANGE
    if "pdf" in message or "raster" in message or "poppler" in message:
        return CompareErrorCode.RASTERIZE_FAILED
    return CompareErrorCode.COMPARE_FAILED


def log_compare_failure(code: CompareErrorCode, exc: BaseException) -> None:
    logger.warning("layout compare failed (%s): %s", code.value, exc)
