# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""An OOM-killed extract child is reported as resource exhaustion, never as a deadline."""

from __future__ import annotations

import os
import signal
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from docuvate_worker.domain.extract_errors import (
    CHILD_EXITED_ERROR_TYPE,
    CHILD_KILLED_ERROR_TYPE,
    RESOURCE_EXHAUSTED_ERROR_TYPE,
    ExtractPermanentError,
)
from docuvate_worker.infrastructure.extract_memory.child_process_diagnostics import (
    child_exit_envelope,
)
from docuvate_worker.infrastructure.extract_memory.extract_subprocess_pool import PooledExtractChild
from docuvate_worker.infrastructure.extract_memory.retry_policy import (
    MEMORY_RETRY_PAYLOAD_KEY,
    memory_retry_scope,
    with_memory_retry,
)
from docuvate_worker.presentation import extract_subprocess_runner

_POOL = "docuvate_worker.infrastructure.extract_memory.extract_subprocess_pool"


def _dead_child(returncode: int) -> MagicMock:
    proc = MagicMock()
    proc.poll.side_effect = [None, returncode]
    proc.stdin = MagicMock()
    proc.stdout = MagicMock()
    return proc


@pytest.mark.parametrize(
    ("returncode", "error_type", "permanent"),
    [(-signal.SIGKILL, CHILD_KILLED_ERROR_TYPE, True), (1, CHILD_EXITED_ERROR_TYPE, False)],
)
def test_child_exit_envelope_types_the_exit(
    returncode: int, error_type: str, *, permanent: bool
) -> None:
    envelope = child_exit_envelope(returncode, "x")
    assert envelope["ok"] is False
    assert envelope["error_type"] == error_type
    assert envelope["permanent"] is permanent


def test_pool_child_killed_mid_job_returns_killed_envelope_not_deadline() -> None:
    child = PooledExtractChild(intra_op_threads=1)
    proc = _dead_child(-signal.SIGKILL)
    child.bind_subprocess_for_testing(proc)
    with (
        patch(f"{_POOL}._readline_with_timeout", return_value=""),
        patch(f"{_POOL}.attach_pool_child_to_active"),
        patch.object(child, "_close") as close,
    ):
        envelope = child.run_job({"mime_type": "application/pdf"}, timeout=60.0)

    assert envelope["error_type"] == CHILD_KILLED_ERROR_TYPE
    close.assert_called_once_with(reason="exited_during_job")


def test_runner_retries_once_with_reduced_settings_then_succeeds() -> None:
    calls: list[dict[str, Any]] = []
    killed = child_exit_envelope(-signal.SIGKILL, "killed")

    def fake_once(payload: dict[str, Any], *, timeout: float) -> dict[str, Any]:
        calls.append(payload)
        if len(calls) == 1:
            return killed
        return {"ok": True, "result": {"text": "ok", "fields": []}}

    with patch.object(extract_subprocess_runner, "_run_subprocess_once", side_effect=fake_once):
        result = extract_subprocess_runner._run_extract_subprocess(
            {"mime_type": "application/pdf"}, timeout=1.0
        )

    assert result.text == "ok"
    assert MEMORY_RETRY_PAYLOAD_KEY not in calls[0]
    assert calls[1][MEMORY_RETRY_PAYLOAD_KEY] is True


def test_runner_reports_resource_exhausted_when_the_retry_is_killed_too() -> None:
    killed = child_exit_envelope(-signal.SIGKILL, "killed")
    with (
        patch.object(extract_subprocess_runner, "_run_subprocess_once", return_value=killed) as run,
        pytest.raises(ExtractPermanentError) as exc_info,
    ):
        extract_subprocess_runner._run_extract_subprocess(
            {"mime_type": "application/pdf"}, timeout=1.0
        )

    assert run.call_count == 2
    assert exc_info.value.error_type == RESOURCE_EXHAUSTED_ERROR_TYPE


def test_memory_retry_scope_applies_overrides_only_for_the_marked_job(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("DOCUVATE_LAYOUT_COMPARE_MAX_PIXELS", raising=False)
    payload: dict[str, Any] = {"mime_type": "application/pdf"}
    with memory_retry_scope(payload):
        assert "DOCUVATE_LAYOUT_COMPARE_MAX_PIXELS" not in os.environ
    with memory_retry_scope(with_memory_retry(payload)):
        assert os.environ["DOCUVATE_LAYOUT_COMPARE_MAX_PIXELS"] == "1000000"
        assert os.environ["DOCUVATE_PDF_RASTER_DPI"] == "150"
    assert "DOCUVATE_LAYOUT_COMPARE_MAX_PIXELS" not in os.environ
    assert MEMORY_RETRY_PAYLOAD_KEY not in payload
