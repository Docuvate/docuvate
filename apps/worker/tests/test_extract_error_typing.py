# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Child failures are classified by exception type, never by message text."""

from __future__ import annotations

from docuvate_worker.domain.extract_errors import permanent_failure_from_subprocess
from docuvate_worker.presentation.extract_subprocess_runner import (
    CHILD_KILLED_ERROR_TYPE,
    _sigkill_envelope,
)


def test_message_text_does_not_make_a_failure_permanent() -> None:
    assert (
        permanent_failure_from_subprocess(
            error_type="RuntimeError",
            reason="out of memory / SIGKILL / zu groß / math range error",
        )
        is None
    )


def test_permanent_exception_types_are_permanent() -> None:
    failure = permanent_failure_from_subprocess(error_type="OverflowError", reason="x")
    assert failure is not None
    assert failure.error_type == "OverflowError"


def test_sigkill_detection_uses_the_typed_error_type() -> None:
    assert _sigkill_envelope({"ok": False, "error_type": CHILD_KILLED_ERROR_TYPE, "error": "x"})
    assert not _sigkill_envelope(
        {"ok": False, "error_type": "RuntimeError", "error": "killed by SIGKILL"}
    )
