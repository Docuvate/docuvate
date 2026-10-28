# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import json
from unittest.mock import MagicMock, patch

import pytest

from docuvate_worker.domain.extract_errors import ExtractRetryableError
from docuvate_worker.presentation.extract_subprocess_pool import PooledExtractChild


def test_run_job_raises_retryable_when_stdout_times_out(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DOCUVATE_EXTRACT_CANCEL_GRACE_SECONDS", "0.01")
    child = PooledExtractChild(intra_op_threads=1)
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


def test_planned_recycle_is_not_postponed_under_memory_pressure() -> None:
    child = PooledExtractChild(intra_op_threads=1)
    old_proc = MagicMock()
    old_proc.poll.return_value = None
    child.bind_subprocess_for_testing(old_proc)
    child._jobs_served = 5  # noqa: SLF001 - drive the recycle threshold directly
    child._recycle_after = 1  # noqa: SLF001
    new_proc = MagicMock()
    new_proc.poll.return_value = None
    new_proc.stdout = MagicMock()
    new_proc.stdin = MagicMock()
    envelope = json.dumps({"ok": True, "result": {}})

    with (
        patch(
            "docuvate_worker.infrastructure.extract_memory.memory_pressure.cgroup_under_memory_pressure",
            return_value=True,
        ),
        patch(
            "docuvate_worker.presentation.extract_subprocess_pool._readline_with_timeout",
            return_value=envelope,
        ),
        patch.object(child, "_close") as close,
        patch.object(child, "_spawn", return_value=new_proc) as spawn,
        patch("docuvate_worker.presentation.extract_subprocess_pool.attach_pool_child_to_active"),
    ):
        child.run_job({"mime_type": "text/plain"}, timeout=1.0)

    close.assert_any_call(reason="planned_recycle")
    spawn.assert_called_once()
