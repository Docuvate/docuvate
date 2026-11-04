# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Reduced settings for the single retry after an extract child was OOM-killed.

The parent marks the retried job payload; the child applies the overrides for that job only,
so a warm pooled child and the parent's environment are never changed for later documents.
"""

from __future__ import annotations

import os
from collections.abc import Iterator, Mapping
from contextlib import AbstractContextManager, contextmanager, nullcontext
from typing import Any

MEMORY_RETRY_PAYLOAD_KEY = "memory_retry"

_ENV_RETRY_CHUNK_PAGES = "DOCUVATE_EXTRACT_RETRY_CHUNK_PAGES"
_ENV_RETRY_MAX_PIXELS = "DOCUVATE_EXTRACT_RETRY_MAX_PIXELS"
_ENV_RETRY_RASTER_DPI = "DOCUVATE_EXTRACT_RETRY_RASTER_DPI"
_ENV_RETRY_COMPARE_MAX_PIXELS = "DOCUVATE_EXTRACT_RETRY_COMPARE_MAX_PIXELS"


def memory_retry_env_overrides() -> dict[str, str]:
    chunk = os.environ.get(_ENV_RETRY_CHUNK_PAGES, "4").strip()
    pixels = os.environ.get(_ENV_RETRY_MAX_PIXELS, "2500000").strip()
    dpi = os.environ.get(_ENV_RETRY_RASTER_DPI, "150").strip()
    compare_pixels = os.environ.get(_ENV_RETRY_COMPARE_MAX_PIXELS, "1000000").strip()
    return {
        "DOCUVATE_EXTRACT_PDF_CHUNK_PAGES": chunk,
        "DOCUVATE_PDF_RASTER_MAX_PIXELS": pixels,
        "DOCUVATE_PDF_RASTER_DPI": dpi,
        "DOCUVATE_PDF_RASTER_MAX_DPI": dpi,
        "DOCUVATE_OCR_PDF_DPI": dpi,
        "DOCUVATE_LAYOUT_COMPARE_MAX_PIXELS": compare_pixels,
    }


def with_memory_retry(payload: Mapping[str, Any]) -> dict[str, Any]:
    """Copy of ``payload`` that tells the child to run with reduced memory settings."""
    return {**payload, MEMORY_RETRY_PAYLOAD_KEY: True}


@contextmanager
def apply_memory_retry_overrides() -> Iterator[None]:
    previous: dict[str, str | None] = {}
    overrides = memory_retry_env_overrides()
    for key, value in overrides.items():
        previous[key] = os.environ.get(key)
        os.environ[key] = value
    try:
        yield
    finally:
        for key, old in previous.items():
            if old is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = old


def memory_retry_scope(payload: Mapping[str, Any]) -> AbstractContextManager[None]:
    """Child side: reduced settings for this job when the parent marked it as a retry."""
    if payload.get(MEMORY_RETRY_PAYLOAD_KEY) is True:
        return apply_memory_retry_overrides()
    return nullcontext()
