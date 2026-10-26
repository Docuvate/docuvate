# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import json
from unittest.mock import MagicMock, patch

import pytest

from docuvate_worker.domain.extract_errors import ExtractRetryableError
from docuvate_worker.presentation.extract_subprocess_pool import _PooledExtractChild


def test_run_job_raises_retryable_when_stdout_times_out(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DOCUVATE_EXTRACT_CANCEL_GRACE_SECONDS", "0.01")
    child = _PooledExtractChild(intra_op_threads=1)
    proc = MagicMock()
    proc.poll.return_value = None
    proc.stdin = MagicMock()
    proc.stdout = MagicMock()
    proc.stdout.readline.return_value = ""
    child.bind_subprocess_for_testing(proc)

    with (
        patch(
            "docuvate_worker.presentation.extract_subprocess_pool._readline_with_timeout",
            return_value=None,
        ),
        patch.object(child, "_close"),
        pytest.raises(ExtractRetryableError) as exc_info,
    ):
        child.run_job({"mime_type": "text/plain"}, timeout=0.01)

    assert exc_info.value.error_type == "ExtractDeadlineExceeded"
