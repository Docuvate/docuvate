# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Limit concurrent extractions based on cgroup free memory and job estimates."""

from __future__ import annotations

import io
import logging
import os
import threading
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass

from pypdf import PdfReader

from docuvate_worker.domain.extract_errors import ExtractPermanentError
from docuvate_worker.infrastructure.extract_memory.cgroup import (
    cgroup_memory_current_bytes,
    cgroup_memory_limit_bytes,
)
from docuvate_worker.infrastructure.extract_memory.pixel_budget import (
    page_pixel_count_at_dpi,
)
from docuvate_worker.infrastructure.extract_memory.raster_estimate import (
    estimate_raster_dpi,
    estimate_raster_max_dpi,
    estimate_raster_max_pixels_per_page,
)
from docuvate_worker.infrastructure.extractors.pdf_chunk_extract import pdf_page_count

logger = logging.getLogger(__name__)

_ENV_BYTES_PER_MEGAPIXEL = "DOCUVATE_EXTRACT_MEM_BYTES_PER_MEGAPIXEL"
_ENV_BASE_OVERHEAD = "DOCUVATE_EXTRACT_MEM_BASE_OVERHEAD_BYTES"
_ENV_HEADROOM = "DOCUVATE_EXTRACT_MEM_HEADROOM_BYTES"
_ENV_MIN_FREE = "DOCUVATE_EXTRACT_MEM_MIN_FREE_BYTES"
_DEFAULT_BYTES_PER_MP = 48_000_000
_DEFAULT_BASE_OVERHEAD = 450_000_000
_DEFAULT_HEADROOM = 200_000_000
_DEFAULT_MIN_FREE = 150_000_000


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name, "").strip()
    if not raw.isdigit():
        return default
    return int(raw)


def _pdf_page_sizes_pt(content: bytes) -> list[tuple[float, float]]:
    try:
        reader = PdfReader(io.BytesIO(content))
        sizes: list[tuple[float, float]] = []
        for page in reader.pages:
            box = page.mediabox
            sizes.append((float(box.width), float(box.height)))
        return sizes
    except Exception:
        return []


def estimate_extract_memory_bytes(content: bytes, mime_type: str) -> int:
    """Conservative RSS estimate from page count and raster megapixels."""
    base = _env_int(_ENV_BASE_OVERHEAD, _DEFAULT_BASE_OVERHEAD)
    bytes_per_mp = _env_int(_ENV_BYTES_PER_MEGAPIXEL, _DEFAULT_BYTES_PER_MP)
    if mime_type != "application/pdf":
        return base + bytes_per_mp
    pages = pdf_page_count(content)
    if pages <= 0:
        return base
    target_dpi = estimate_raster_dpi()
    max_dpi = estimate_raster_max_dpi()
    dpi = min(target_dpi, max_dpi)
    max_px = estimate_raster_max_pixels_per_page()
    sizes = _pdf_page_sizes_pt(content)
    if not sizes:
        megapixels = pages * (max_px / 1_000_000.0)
    else:
        mp_sum = 0.0
        for width_pt, height_pt in sizes:
            px = page_pixel_count_at_dpi(width_pt, height_pt, dpi)
            mp_sum += min(px, max_px) / 1_000_000.0
        megapixels = mp_sum
    return base + int(megapixels * bytes_per_mp)


@dataclass
class _AdmissionSlot:
    estimate_bytes: int


class ExtractAdmissionController:
    """Process-wide gate: one slot per job while estimated RSS fits cgroup headroom."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._active: list[_AdmissionSlot] = []

    def _headroom_bytes(self) -> int:
        return _env_int(_ENV_HEADROOM, _DEFAULT_HEADROOM)

    def _min_free_bytes(self) -> int:
        return _env_int(_ENV_MIN_FREE, _DEFAULT_MIN_FREE)

    def _available_for_jobs(self) -> int | None:
        limit = cgroup_memory_limit_bytes()
        current = cgroup_memory_current_bytes()
        if limit is None or current is None:
            return None
        reserved = sum(slot.estimate_bytes for slot in self._active)
        free = limit - current - reserved - self._headroom_bytes()
        return max(0, free)

    def try_acquire(self, estimate_bytes: int) -> bool:
        with self._lock:
            available = self._available_for_jobs()
            if available is None:
                self._active.append(_AdmissionSlot(estimate_bytes=estimate_bytes))
                return True
            need = estimate_bytes + self._min_free_bytes()
            if available < need:
                logger.warning(
                    "extract_admission_denied estimate_bytes=%s available=%s active_jobs=%s",
                    estimate_bytes,
                    available,
                    len(self._active),
                )
                return False
            self._active.append(_AdmissionSlot(estimate_bytes=estimate_bytes))
            return True

    def release(self, estimate_bytes: int) -> None:
        with self._lock:
            for index, slot in enumerate(self._active):
                if slot.estimate_bytes == estimate_bytes:
                    del self._active[index]
                    return
            if self._active:
                self._active.pop()


_admission_controller = ExtractAdmissionController()


def admission_controller() -> ExtractAdmissionController:
    return _admission_controller


@contextmanager
def extract_admission_slot(content: bytes, mime_type: str) -> Iterator[None]:
    if os.environ.get("DOCUVATE_EXTRACT_ADMISSION", "1") != "1":
        yield
        return
    estimate = estimate_extract_memory_bytes(content, mime_type)
    controller = admission_controller()
    if not controller.try_acquire(estimate):
        raise ExtractPermanentError(
            reason=(
                "Document exceeds available worker memory; "
                "try again later or upload a smaller scan."
            ),
            error_type="ExtractResourceExhausted",
        )
    try:
        yield
    finally:
        controller.release(estimate)
