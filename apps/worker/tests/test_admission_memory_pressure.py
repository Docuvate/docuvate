# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import pytest

from docuvate_worker.domain.extract_errors import ExtractRetryableError
from docuvate_worker.infrastructure.extract_memory.admission import (
    decide_extract_admission,
    document_exceeds_cgroup_even_without_models,
    extract_admission_slot,
)
from docuvate_worker.infrastructure.extract_memory.cgroup import CgroupMemorySnapshot
from tests.synthetic_layout_pdfs import form_disclosure_pdf

_TIGHT_MODELS_RESIDENT = CgroupMemorySnapshot(
    limit_bytes=2_147_483_648,
    current_bytes=1_950_000_000,
    anon_bytes=1_800_000_000,
    kernel_bytes=50_000_000,
    active_file_bytes=0,
    inactive_file_bytes=100_000_000,
    file_bytes=100_000_000,
)


def test_saturated_cgroup_idle_job_is_memory_pressure_not_permanent() -> None:
    decision = decide_extract_admission(
        snapshot=_TIGHT_MODELS_RESIDENT,
        estimate_bytes=400_000_000,
        minimum_chunk_bytes=52_000_000,
        active_jobs=0,
        headroom_bytes=200_000_000,
        min_free_bytes=64_000_000,
        reserved_bytes=0,
        count_active_file=False,
        evictable_model_bytes=550_000_000,
    )
    assert decision.admit
    assert decision.reason == "idle_evictable_models"


def test_transient_pressure_raises_retryable_not_permanent(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DOCUVATE_EXTRACT_ADMISSION", "1")
    monkeypatch.setenv("DOCUVATE_EXTRACT_ADMISSION_WAIT_ATTEMPTS", "1")
    pdf = form_disclosure_pdf()

    def _tight_snapshot() -> CgroupMemorySnapshot:
        return _TIGHT_MODELS_RESIDENT

    monkeypatch.setattr(
        "docuvate_worker.infrastructure.extract_memory.admission.read_cgroup_memory_snapshot",
        _tight_snapshot,
    )
    monkeypatch.setattr(
        "docuvate_worker.infrastructure.extract_memory.admission.evictable_pool_model_bytes",
        lambda: 0,
    )
    monkeypatch.setattr(
        "docuvate_worker.infrastructure.extract_memory.admission.reclaim_model_memory_for_admission",
        lambda: 0,
    )

    with pytest.raises(ExtractRetryableError):
        with extract_admission_slot(pdf, "application/pdf"):
            pass


def test_huge_document_is_permanent_even_without_models() -> None:
    assert document_exceeds_cgroup_even_without_models(
        2_000_000_000,
        _TIGHT_MODELS_RESIDENT,
        headroom_bytes=200_000_000,
        min_free_bytes=64_000_000,
    )
