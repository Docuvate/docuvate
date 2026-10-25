# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Automatic downgrade settings after child OOM / SIGKILL."""

from __future__ import annotations

import os
from collections.abc import Iterator
from contextlib import contextmanager

_ENV_RETRY_CHUNK_PAGES = "DOCUVATE_EXTRACT_RETRY_CHUNK_PAGES"
_ENV_RETRY_MAX_PIXELS = "DOCUVATE_EXTRACT_RETRY_MAX_PIXELS"
_ENV_RETRY_RASTER_DPI = "DOCUVATE_EXTRACT_RETRY_RASTER_DPI"
_FLAG_APPLIED = "DOCUVATE_EXTRACT_MEMORY_RETRY_APPLIED"


def memory_retry_env_overrides() -> dict[str, str]:
    chunk = os.environ.get(_ENV_RETRY_CHUNK_PAGES, "4").strip()
    pixels = os.environ.get(_ENV_RETRY_MAX_PIXELS, "2500000").strip()
    dpi = os.environ.get(_ENV_RETRY_RASTER_DPI, "150").strip()
    return {
        "DOCUVATE_EXTRACT_PDF_CHUNK_PAGES": chunk,
        "DOCUVATE_PDF_RASTER_MAX_PIXELS": pixels,
        "DOCUVATE_PDF_RASTER_DPI": dpi,
        "DOCUVATE_PDF_RASTER_MAX_DPI": dpi,
        "DOCUVATE_OCR_PDF_DPI": dpi,
        _FLAG_APPLIED: "1",
    }


def memory_retry_already_applied() -> bool:
    return os.environ.get(_FLAG_APPLIED, "0") == "1"


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
