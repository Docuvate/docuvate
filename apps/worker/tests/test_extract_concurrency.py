# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import os

from docuvate_worker.infrastructure.extract_memory.extract_concurrency import (
    default_extract_concurrency,
    resolve_extract_concurrency,
)


def test_default_extract_concurrency_within_bounds(monkeypatch) -> None:
    monkeypatch.delenv("DOCUVATE_EXTRACT_CONCURRENCY", raising=False)
    value = default_extract_concurrency()
    assert 1 <= value <= 4


def test_resolve_extract_concurrency_honors_env(monkeypatch) -> None:
    monkeypatch.setenv("DOCUVATE_EXTRACT_CONCURRENCY", "3")
    assert resolve_extract_concurrency() == 3
