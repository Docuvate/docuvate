# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Cgroup-aware admission using incremental RSS estimates (reclaimable page cache excluded)."""

from __future__ import annotations

import io
import logging
import os
import threading
import time
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass

from pypdf import PdfReader

from docuvate_worker.domain.extract_errors import ExtractPermanentError, ExtractRetryableError
from docuvate_worker.infrastructure.extract_memory.cgroup import (
    CgroupMemorySnapshot,
    cgroup_memory_available_bytes,
    read_cgroup_memory_snapshot,
)
from docuvate_worker.infrastructure.extract_memory.extract_concurrency import (
    DEFAULT_PARENT_RSS_BYTES,
)
from docuvate_worker.infrastructure.extract_memory.memory_pressure import (
    cgroup_should_reclaim_idle_models,
)
from docuvate_worker.infrastructure.extract_memory.model_residency import (
    evictable_pool_model_bytes,
    reclaim_model_memory_for_admission,
)
from docuvate_worker.infrastructure.extract_memory.pixel_budget import (
    effective_raster_dpi,
    page_pixel_count_at_dpi,
)
from docuvate_worker.infrastructure.extract_memory.pool_memory import pool_memory_reserved_bytes
from docuvate_worker.infrastructure.extract_memory.raster_estimate import (
    estimate_raster_dpi,
    estimate_raster_max_dpi,
    estimate_raster_max_pixels_per_page,
)
from docuvate_worker.infrastructure.extractors.pdf_chunk_extract import (
    pdf_chunk_page_size,
    pdf_page_count,
)

logger = logging.getLogger(__name__)

_ENV_BYTES_PER_MEGAPIXEL = "DOCUVATE_EXTRACT_MEM_BYTES_PER_MEGAPIXEL"
_ENV_PEAK_RASTER_PAGES = "DOCUVATE_EXTRACT_MEM_PEAK_RASTER_PAGES"
_ENV_HEADROOM = "DOCUVATE_EXTRACT_MEM_HEADROOM_BYTES"
_ENV_MIN_FREE = "DOCUVATE_EXTRACT_MEM_MIN_FREE_BYTES"
_ENV_COUNT_ACTIVE_FILE = "DOCUVATE_EXTRACT_MEM_COUNT_ACTIVE_FILE"
_ENV_ADMISSION_WAIT_MS = "DOCUVATE_EXTRACT_ADMISSION_WAIT_MS"
_ENV_ADMISSION_WAIT_ATTEMPTS = "DOCUVATE_EXTRACT_ADMISSION_WAIT_ATTEMPTS"
_DEFAULT_BYTES_PER_MP = 52_000_000
_DEFAULT_PEAK_RASTER_PAGES = 2
_DEFAULT_HEADROOM = 300_000_000
_DEFAULT_MIN_FREE = 96_000_000
_DEFAULT_WAIT_MS = 250
_DEFAULT_WAIT_ATTEMPTS = 12
_MIN_CHUNK_PAGES = 1


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name, "").strip()
    if not raw.isdigit():
        return default
    return int(raw)


def _env_bool(name: str, default: bool) -> bool:
    raw = os.environ.get(name, "").strip().casefold()
    if not raw:
        return default
    return raw in {"1", "true", "yes", "on"}


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


def _megapixels_for_pdf_pages(
    sizes: list[tuple[float, float]],
    pages_to_count: int,
    *,
    target_dpi: int,
    max_dpi: int,
    max_px: int,
) -> float:
    if pages_to_count <= 0:
        return 0.0
    if not sizes:
        return pages_to_count * (max_px / 1_000_000.0)
    mp_sum = 0.0
    for width_pt, height_pt in sizes[:pages_to_count]:
        dpi = effective_raster_dpi(
            width_pt,
            height_pt,
            target_dpi=target_dpi,
            max_dpi=max_dpi,
            max_pixels_per_page=max_px,
        )
        px = page_pixel_count_at_dpi(width_pt, height_pt, dpi)
        mp_sum += min(px, max_px) / 1_000_000.0
    return mp_sum


def estimate_extract_incremental_memory_bytes(
    content: bytes,
    mime_type: str,
    *,
    pages_per_chunk: int | None = None,
) -> int:
    """Per-job RSS increment (models already resident; one OCR chunk at a time)."""
    bytes_per_mp = _env_int(_ENV_BYTES_PER_MEGAPIXEL, _DEFAULT_BYTES_PER_MP)
    if mime_type != "application/pdf":
        return bytes_per_mp
    pages = pdf_page_count(content)
    if pages <= 0:
        return bytes_per_mp
    chunk_pages = pages_per_chunk if pages_per_chunk is not None else pdf_chunk_page_size()
    chunk_pages = max(_MIN_CHUNK_PAGES, chunk_pages)
    peak_raster_pages = _env_int(_ENV_PEAK_RASTER_PAGES, _DEFAULT_PEAK_RASTER_PAGES)
    peak_raster_pages = max(_MIN_CHUNK_PAGES, peak_raster_pages)
    pages_in_chunk = min(chunk_pages, pages, peak_raster_pages)
    target_dpi = estimate_raster_dpi()
    max_dpi = estimate_raster_max_dpi()
    max_px = estimate_raster_max_pixels_per_page()
    sizes = _pdf_page_sizes_pt(content)
    megapixels = _megapixels_for_pdf_pages(
        sizes,
        pages_in_chunk,
        target_dpi=target_dpi,
        max_dpi=max_dpi,
        max_px=max_px,
    )
    return max(bytes_per_mp, int(megapixels * bytes_per_mp))


def estimate_minimum_chunk_memory_bytes(content: bytes, mime_type: str) -> int:
    """Smallest single-chunk incremental estimate (one page at pixel budget)."""
    return estimate_extract_incremental_memory_bytes(
        content,
        mime_type,
        pages_per_chunk=_MIN_CHUNK_PAGES,
    )


@dataclass(frozen=True, slots=True)
class AdmissionDecision:
    admit: bool
    available_bytes: int | None
    reason: str
    ticket: int | None = None


def document_exceeds_cgroup_even_without_models(
    minimum_chunk_bytes: int,
    snapshot: CgroupMemorySnapshot | None,
    *,
    headroom_bytes: int,
    min_free_bytes: int,
) -> bool:
    """True when a single page cannot fit even if all pool models were unloaded."""
    if snapshot is None or snapshot.limit_bytes is None:
        return False
    ceiling = (
        snapshot.limit_bytes
        - headroom_bytes
        - min_free_bytes
        - DEFAULT_PARENT_RSS_BYTES
    )
    return minimum_chunk_bytes > max(0, ceiling)


def decide_extract_admission(
    *,
    snapshot: CgroupMemorySnapshot | None,
    estimate_bytes: int,
    minimum_chunk_bytes: int,
    active_jobs: int,
    headroom_bytes: int,
    min_free_bytes: int,
    reserved_bytes: int,
    count_active_file: bool,
    evictable_model_bytes: int = 0,
) -> AdmissionDecision:
    if snapshot is None or snapshot.limit_bytes is None:
        return AdmissionDecision(admit=True, available_bytes=None, reason="no_cgroup_limit")
    available = cgroup_memory_available_bytes(
        snapshot,
        headroom_bytes=headroom_bytes,
        reserved_bytes=reserved_bytes,
        count_active_file=count_active_file,
    )
    if active_jobs <= 0:
        need = minimum_chunk_bytes + min_free_bytes + reserved_bytes
        effective_available = (available or 0) + evictable_model_bytes
        if available is not None and effective_available < need:
            if document_exceeds_cgroup_even_without_models(
                minimum_chunk_bytes,
                snapshot,
                headroom_bytes=headroom_bytes,
                min_free_bytes=min_free_bytes,
            ):
                return AdmissionDecision(
                    admit=False,
                    available_bytes=available,
                    reason="minimum_chunk_exceeds_cgroup",
                )
            return AdmissionDecision(
                admit=False,
                available_bytes=available,
                reason="memory_pressure",
            )
        if (
            available is not None
            and available < need
            and effective_available >= need
            and evictable_model_bytes > 0
        ):
            return AdmissionDecision(
                admit=True,
                available_bytes=available,
                reason="idle_evictable_models",
            )
        return AdmissionDecision(admit=True, available_bytes=available, reason="idle_first_job")
    if available is None:
        return AdmissionDecision(admit=True, available_bytes=None, reason="no_cgroup_limit")
    need = estimate_bytes + min_free_bytes
    if available >= need:
        return AdmissionDecision(
            admit=True,
            available_bytes=available,
            reason="capacity_ok",
        )
    return AdmissionDecision(
        admit=False,
        available_bytes=available,
        reason="concurrent_capacity",
    )


@dataclass
class _AdmissionSlot:
    ticket: int
    estimate_bytes: int
    started: bool = False


class ExtractAdmissionController:
    """Process-wide gate: one slot per job while incremental estimates fit cgroup headroom."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._active: list[_AdmissionSlot] = []
        self._next_ticket = 1

    def _headroom_bytes(self) -> int:
        return _env_int(_ENV_HEADROOM, _DEFAULT_HEADROOM)

    def _min_free_bytes(self) -> int:
        return _env_int(_ENV_MIN_FREE, _DEFAULT_MIN_FREE)

    def _count_active_file(self) -> bool:
        return _env_bool(_ENV_COUNT_ACTIVE_FILE, False)

    def _reserved_bytes(self) -> int:
        """Estimates for admitted jobs whose memory is not yet visible in cgroup usage.

        Running jobs are already part of measured cgroup usage; counting their estimate
        again would double count and deny capacity that is actually free.
        """
        return sum(slot.estimate_bytes for slot in self._active if not slot.started)

    def try_acquire(
        self,
        estimate_bytes: int,
        minimum_chunk_bytes: int,
    ) -> AdmissionDecision:
        with self._lock:
            snapshot = read_cgroup_memory_snapshot()
            pending_jobs = len(self._active) + 1
            pool_reserved = pool_memory_reserved_bytes(pending_jobs=pending_jobs)
            evictable = evictable_pool_model_bytes() if len(self._active) == 0 else 0
            decision = decide_extract_admission(
                snapshot=snapshot,
                estimate_bytes=estimate_bytes,
                minimum_chunk_bytes=minimum_chunk_bytes,
                active_jobs=len(self._active),
                headroom_bytes=self._headroom_bytes(),
                min_free_bytes=self._min_free_bytes(),
                reserved_bytes=self._reserved_bytes() + pool_reserved,
                count_active_file=self._count_active_file(),
                evictable_model_bytes=evictable,
            )
            if decision.admit:
                if decision.reason == "idle_evictable_models":
                    reclaim_model_memory_for_admission()
                ticket = self._next_ticket
                self._next_ticket += 1
                self._active.append(_AdmissionSlot(ticket=ticket, estimate_bytes=estimate_bytes))
                decision = AdmissionDecision(
                    admit=True,
                    available_bytes=decision.available_bytes,
                    reason=decision.reason,
                    ticket=ticket,
                )
            else:
                logger.warning(
                    "extract_admission_denied estimate_bytes=%s pool_reserved=%s available=%s "
                    "active_jobs=%s reason=%s",
                    estimate_bytes,
                    pool_reserved,
                    decision.available_bytes,
                    len(self._active),
                    decision.reason,
                )
            return decision

    def mark_started(self, ticket: int) -> None:
        """The admitted job is running; from now on its memory shows up in cgroup usage."""
        with self._lock:
            for slot in self._active:
                if slot.ticket == ticket:
                    slot.started = True
                    return

    def release(self, ticket: int) -> None:
        idle_after_release = False
        with self._lock:
            self._active = [slot for slot in self._active if slot.ticket != ticket]
            idle_after_release = len(self._active) == 0
        if idle_after_release and cgroup_should_reclaim_idle_models():
            reclaim_model_memory_for_admission()

    def active_job_count(self) -> int:
        with self._lock:
            return len(self._active)


_admission_controller = ExtractAdmissionController()


def admission_controller() -> ExtractAdmissionController:
    return _admission_controller


def _wait_attempts() -> int:
    return max(1, _env_int(_ENV_ADMISSION_WAIT_ATTEMPTS, _DEFAULT_WAIT_ATTEMPTS))


def _wait_interval_seconds() -> float:
    return max(0.0, _env_int(_ENV_ADMISSION_WAIT_MS, _DEFAULT_WAIT_MS) / 1000.0)


def admission_retry_after_seconds() -> int:
    return max(1, int(_wait_attempts() * _wait_interval_seconds()))


@contextmanager
def extract_admission_slot(content: bytes, mime_type: str) -> Iterator[None]:
    if os.environ.get("DOCUVATE_EXTRACT_ADMISSION", "1") != "1":
        yield
        return
    estimate = estimate_extract_incremental_memory_bytes(content, mime_type)
    minimum = estimate_minimum_chunk_memory_bytes(content, mime_type)
    controller = admission_controller()
    decision: AdmissionDecision | None = None
    attempts = _wait_attempts()
    for attempt in range(attempts):
        decision = controller.try_acquire(estimate, minimum)
        if decision.admit:
            break
        if decision.reason == "minimum_chunk_exceeds_cgroup":
            raise ExtractPermanentError(
                reason=(
                    "Document requires more memory than this worker can provide "
                    "even with models unloaded."
                ),
                error_type="ExtractResourceExhausted",
            )
        if (
            decision.reason in {"memory_pressure", "concurrent_capacity"}
            and reclaim_model_memory_for_admission() > 0
        ):
            decision = controller.try_acquire(estimate, minimum)
            if decision.admit:
                break
        if attempt + 1 < attempts:
            time.sleep(_wait_interval_seconds())
    if decision is None or not decision.admit:
        raise ExtractRetryableError(
            reason=(
                "Worker memory is temporarily fully utilized; "
                "retry extraction shortly."
            ),
            error_type="ExtractResourceBusy",
        )
    ticket = decision.ticket
    if ticket is None:
        yield
        return
    controller.mark_started(ticket)
    try:
        yield
    finally:
        controller.release(ticket)


# Backwards-compatible alias for tests and metrics.
def estimate_extract_memory_bytes(content: bytes, mime_type: str) -> int:
    return estimate_extract_incremental_memory_bytes(content, mime_type)
