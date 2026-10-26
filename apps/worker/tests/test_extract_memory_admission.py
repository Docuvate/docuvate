# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import pytest

from docuvate_worker.domain.extract_errors import ExtractRetryableError
from docuvate_worker.infrastructure.extract_memory.admission import (
    decide_extract_admission,
    estimate_extract_incremental_memory_bytes,
    estimate_extract_memory_bytes,
    estimate_minimum_chunk_memory_bytes,
    extract_admission_slot,
)
from docuvate_worker.infrastructure.extract_memory.cgroup import (
    CgroupMemorySnapshot,
    cgroup_memory_available_bytes,
)
from docuvate_worker.infrastructure.extract_memory.pixel_budget import (
    effective_raster_dpi,
    page_pixel_count_at_dpi,
)
from tests.public_domain_dense_scans import public_domain_dense_scan_pdf
from tests.synthetic_scan_pdfs import scanned_image_only_multipage_pdf

_PRODUCTION_IDLE = CgroupMemorySnapshot(
    limit_bytes=2_147_483_648,
    current_bytes=1_061_740_544,
    anon_bytes=400_404_480,
    kernel_bytes=31_322_112,
    active_file_bytes=0,
    inactive_file_bytes=628_690_944,
    file_bytes=628_690_944,
)

_LOG_ESTIMATE_BYTES = 821_012_544
_LOG_AVAILABLE_LEGACY = 170_671_616
_HEADROOM = 200_000_000
_MIN_FREE = 150_000_000


def _legacy_available_for_jobs(snapshot: CgroupMemorySnapshot, headroom: int, reserved: int) -> int:
    if snapshot.limit_bytes is None or snapshot.current_bytes is None:
        return 0
    return max(0, snapshot.limit_bytes - snapshot.current_bytes - reserved - headroom)


def test_page_pixel_count_at_dpi_letter_size() -> None:
    pixels = page_pixel_count_at_dpi(612.0, 792.0, 200)
    assert 3_600_000 < pixels < 3_900_000


def test_effective_raster_dpi_scales_down_a0() -> None:
    dpi = effective_raster_dpi(
        3370.0,
        2384.0,
        target_dpi=300,
        max_dpi=300,
        max_pixels_per_page=4_000_000,
    )
    assert dpi < 300
    assert page_pixel_count_at_dpi(3370.0, 2384.0, dpi) <= 4_000_000
    assert dpi >= 1


def test_estimate_extract_memory_grows_with_pages_but_is_chunk_bounded() -> None:
    small = scanned_image_only_multipage_pdf(page_count=2, dpi=120)
    medium = scanned_image_only_multipage_pdf(page_count=20, dpi=120)
    large = scanned_image_only_multipage_pdf(page_count=40, dpi=120)
    small_est = estimate_extract_memory_bytes(small, "application/pdf")
    medium_est = estimate_extract_memory_bytes(medium, "application/pdf")
    large_est = estimate_extract_memory_bytes(large, "application/pdf")
    assert large_est >= small_est
    assert medium_est == large_est


def test_reclaimable_aware_available_ignores_inactive_page_cache() -> None:
    available = cgroup_memory_available_bytes(
        _PRODUCTION_IDLE,
        headroom_bytes=_HEADROOM,
        reserved_bytes=0,
        count_active_file=False,
    )
    assert available is not None
    assert available > 1_400_000_000


def test_production_idle_admits_first_job_despite_legacy_denial() -> None:
    legacy_available = _legacy_available_for_jobs(_PRODUCTION_IDLE, _HEADROOM, 0)
    legacy_need = _LOG_ESTIMATE_BYTES + _MIN_FREE
    assert legacy_available < legacy_need
    assert _LOG_AVAILABLE_LEGACY < legacy_need
    decision = decide_extract_admission(
        snapshot=_PRODUCTION_IDLE,
        estimate_bytes=_LOG_ESTIMATE_BYTES,
        minimum_chunk_bytes=estimate_extract_incremental_memory_bytes(
            scanned_image_only_multipage_pdf(page_count=5, dpi=200),
            "application/pdf",
            pages_per_chunk=1,
        ),
        active_jobs=0,
        headroom_bytes=_HEADROOM,
        min_free_bytes=_MIN_FREE,
        reserved_bytes=0,
        count_active_file=False,
    )
    assert decision.admit
    assert decision.reason == "idle_always_admit"


def test_logged_available_with_active_job_denies_under_legacy_need() -> None:
    decision = decide_extract_admission(
        snapshot=_PRODUCTION_IDLE,
        estimate_bytes=_LOG_ESTIMATE_BYTES,
        minimum_chunk_bytes=48_000_000,
        active_jobs=1,
        headroom_bytes=_HEADROOM,
        min_free_bytes=_MIN_FREE,
        reserved_bytes=_LOG_ESTIMATE_BYTES,
        count_active_file=False,
    )
    assert not decision.admit
    assert decision.reason == "concurrent_capacity"


def test_extract_admission_slot_raises_retryable_when_concurrent_capacity_exhausted(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DOCUVATE_EXTRACT_ADMISSION", "1")
    monkeypatch.setenv("DOCUVATE_EXTRACT_ADMISSION_WAIT_ATTEMPTS", "1")
    pdf = public_domain_dense_scan_pdf(20, dpi=300)
    minimum = estimate_minimum_chunk_memory_bytes(pdf, "application/pdf")
    estimate = _LOG_ESTIMATE_BYTES
    controller = __import__(
        "docuvate_worker.infrastructure.extract_memory.admission",
        fromlist=["admission_controller"],
    ).admission_controller()

    def _snapshot() -> CgroupMemorySnapshot:
        return _PRODUCTION_IDLE

    monkeypatch.setattr(
        "docuvate_worker.infrastructure.extract_memory.admission.read_cgroup_memory_snapshot",
        _snapshot,
    )
    monkeypatch.setattr(
        "docuvate_worker.infrastructure.extract_memory.admission.estimate_extract_incremental_memory_bytes",
        lambda _content, _mime, **_kwargs: _LOG_ESTIMATE_BYTES,
    )
    first = controller.try_acquire(estimate, minimum)
    assert first.admit
    try:
        with pytest.raises(ExtractRetryableError) as exc_info:
            with extract_admission_slot(pdf, "application/pdf"):
                pass
        assert exc_info.value.error_type == "ExtractResourceBusy"
    finally:
        controller.release(estimate)


# Warm-worker incremental RSS from public scan benchmarks (models already resident).
_REFERENCE_INCREMENT_MIB: dict[tuple[int, int], float] = {
    (20, 300): 375.0,
    (35, 280): 426.0,
    (50, 260): 432.0,
}


@pytest.mark.parametrize(
    ("pages", "dpi"),
    ((20, 300), (35, 280), (50, 260)),
)
def test_incremental_estimate_tracks_measured_public_scan_peaks(
    pages: int,
    dpi: int,
) -> None:
    pdf = public_domain_dense_scan_pdf(pages, dpi=dpi)
    estimate_mib = estimate_extract_incremental_memory_bytes(pdf, "application/pdf") / (
        1024 * 1024
    )
    reference_mib = _REFERENCE_INCREMENT_MIB[(pages, dpi)]
    assert estimate_mib >= reference_mib * 0.85
    assert estimate_mib <= reference_mib * 1.3
