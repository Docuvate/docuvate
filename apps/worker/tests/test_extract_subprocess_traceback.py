# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import json
from unittest.mock import MagicMock, patch

import pytest

from docuvate_worker.domain.extract_errors import ExtractPermanentError
from docuvate_worker.presentation import extract_subprocess_runner as runner


def test_run_extract_isolated_logs_subprocess_traceback(
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    monkeypatch.delenv("DOCUVATE_ALLOW_IN_PROCESS_EXTRACT", raising=False)
    monkeypatch.setenv("DOCUVATE_EXTRACT_ADMISSION", "0")
    payload = {
        "ok": False,
        "error": "OverflowError: math range error",
        "error_type": "OverflowError",
        "traceback": ["Traceback (most recent call last):\n", '  File "x.py", line 1\n', "OverflowError: math range error\n"],
        "permanent": True,
    }
    proc = MagicMock()
    proc.returncode = 1
    proc.stderr = ""
    with (
        patch.object(runner.subprocess, "run", return_value=proc),
        patch.object(runner.tempfile, "TemporaryFile") as tmp_mock,
        pytest.raises(ExtractPermanentError),
    ):
        handle = MagicMock()
        handle.read.return_value = json.dumps(payload)
        tmp_mock.return_value.__enter__.return_value = handle
        runner.run_extract_isolated(
            content=b"%PDF",
            mime_type="application/pdf",
            engine="pipeline",
            embedding_density_state=None,
            build_exact_fact_index=False,
        )
    assert any("extract subprocess traceback" in record.message for record in caplog.records)
