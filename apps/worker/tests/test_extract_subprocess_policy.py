# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import os

from docuvate_worker.presentation import extract_subprocess_runner as runner


def test_in_process_extract_requires_explicit_allow_flag(monkeypatch) -> None:
    monkeypatch.delenv("DOCUVATE_ALLOW_IN_PROCESS_EXTRACT", raising=False)
    monkeypatch.setenv("DOCUVATE_EXTRACT_SUBPROCESS", "0")
    assert runner._in_process_extract_allowed() is False

    monkeypatch.setenv("DOCUVATE_ALLOW_IN_PROCESS_EXTRACT", "1")
    assert runner._in_process_extract_allowed() is True

    monkeypatch.setenv("DOCUVATE_EXTRACT_SUBPROCESS", "1")
    assert runner._in_process_extract_allowed() is False
