# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Wall-clock deadline for a single /v1/extract job."""

from __future__ import annotations

import os

from docuvate_worker.infrastructure.extractors.pdf_chunk_extract import pdf_page_count

_ENV_BASE_SECONDS = "DOCUVATE_EXTRACT_DEADLINE_BASE_SECONDS"
_ENV_PER_PAGE_SECONDS = "DOCUVATE_EXTRACT_DEADLINE_PER_PAGE_SECONDS"
_ENV_MAX_SECONDS = "DOCUVATE_EXTRACT_TIMEOUT_SECONDS"
_DEFAULT_BASE = 300.0
_DEFAULT_PER_PAGE = 30.0
_DEFAULT_MAX = 900.0


def _positive_float(raw: str | None, fallback: float) -> float:
    if not raw:
        return fallback
    try:
        parsed = float(raw)
    except ValueError:
        return fallback
    if parsed <= 0:
        return fallback
    return parsed


def estimated_document_pages(content: bytes, mime_type: str) -> int:
    lowered = mime_type.casefold()
    if "pdf" in lowered:
        pages = pdf_page_count(content)
        return max(1, pages)
    return 1


def extract_wall_clock_deadline_seconds(content: bytes, mime_type: str) -> float:
    """Configurable per-job deadline: base + per-page allowance, capped by max."""
    base = _positive_float(os.environ.get(_ENV_BASE_SECONDS), _DEFAULT_BASE)
    per_page = _positive_float(os.environ.get(_ENV_PER_PAGE_SECONDS), _DEFAULT_PER_PAGE)
    max_seconds = _positive_float(os.environ.get(_ENV_MAX_SECONDS), _DEFAULT_MAX)
    pages = estimated_document_pages(content, mime_type)
    raw = base + per_page * float(pages)
    return min(raw, max_seconds)
