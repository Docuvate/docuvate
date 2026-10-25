# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import signal
from unittest.mock import MagicMock, patch

import pytest

from docuvate_worker.presentation import extract_subprocess_runner as runner
from docuvate_worker.presentation.extract_subprocess_errors import (
    filter_benign_stderr,
    subprocess_failure_message,
)


def test_subprocess_failure_message_sigkill() -> None:
    stderr = "[W:onnxruntime:Default, telemetry_1ds.cc:600] Failed to persist telemetry device ID\n"
    msg = subprocess_failure_message(-signal.SIGKILL, stderr)
    assert "SIGKILL" in msg
    assert "likely out of memory" in msg
    assert "telemetry" not in msg


def test_filter_benign_stderr_keeps_real_errors() -> None:
    raw = "onnx runtime error: out of memory allocating tensor\n"
    assert "out of memory" in filter_benign_stderr(raw)


def test_run_extract_isolated_reports_sigkill(monkeypatch: pytest.MonkeyPatch) -> None:
    from docuvate_worker.domain.extract_errors import ExtractPermanentError

    monkeypatch.delenv("DOCUVATE_ALLOW_IN_PROCESS_EXTRACT", raising=False)
    monkeypatch.setenv("DOCUVATE_EXTRACT_ADMISSION", "0")
    proc = MagicMock()
    proc.returncode = -signal.SIGKILL
    proc.stderr = (
        "[W:onnxruntime:Default, telemetry_1ds.cc:600] Failed to persist telemetry device ID\n"
    )
    with (
        patch.object(runner.subprocess, "run", side_effect=[proc, proc]),
        pytest.raises(ExtractPermanentError) as exc_info,
    ):
        runner.run_extract_isolated(
            content=b"%PDF",
            mime_type="application/pdf",
            engine="pipeline",
            embedding_density_state=None,
            build_exact_fact_index=False,
        )
    assert exc_info.value.error_type == "ExtractResourceExhausted"
    assert "speicherintensiv" in str(exc_info.value).casefold()
