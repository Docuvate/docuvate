# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import pytest

from docuvate_worker.infrastructure.extract_memory.extract_deadline import (
    extract_wall_clock_deadline_seconds,
)


def test_extract_deadline_base_plus_pages(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DOCUVATE_EXTRACT_DEADLINE_BASE_SECONDS", "300")
    monkeypatch.setenv("DOCUVATE_EXTRACT_DEADLINE_PER_PAGE_SECONDS", "30")
    monkeypatch.setenv("DOCUVATE_EXTRACT_TIMEOUT_SECONDS", "900")
    # minimal PDF header is not a valid multi-page doc; still counts as >=1 page
    seconds = extract_wall_clock_deadline_seconds(b"%PDF-1.4", "application/pdf")
    assert seconds == 330.0


def test_extract_deadline_capped_by_max(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DOCUVATE_EXTRACT_DEADLINE_BASE_SECONDS", "300")
    monkeypatch.setenv("DOCUVATE_EXTRACT_DEADLINE_PER_PAGE_SECONDS", "120")
    monkeypatch.setenv("DOCUVATE_EXTRACT_TIMEOUT_SECONDS", "400")
    seconds = extract_wall_clock_deadline_seconds(b"hello", "text/plain")
    assert seconds == 400.0
