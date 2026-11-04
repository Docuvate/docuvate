# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Extract failures surfaced to the API (permanent vs retryable)."""

from __future__ import annotations


class ExtractPermanentError(Exception):
    """Document or configuration cannot be processed; retrying will not help."""

    __slots__ = ("error_type", "reason")

    def __init__(self, *, reason: str, error_type: str) -> None:
        super().__init__(reason)
        self.reason = reason
        self.error_type = error_type

    def __str__(self) -> str:
        return f"{self.error_type}: {self.reason}"


class ExtractRetryableError(Exception):
    """Worker is temporarily unable to accept work; callers should retry with backoff."""

    __slots__ = ("error_type", "reason")

    def __init__(self, *, reason: str, error_type: str) -> None:
        super().__init__(reason)
        self.reason = reason
        self.error_type = error_type

    def __str__(self) -> str:
        return f"{self.error_type}: {self.reason}"


# The extract child was SIGKILLed mid-job (cgroup OOM killer); retried once with reduced settings.
CHILD_KILLED_ERROR_TYPE = "ExtractChildKilled"
# The extract child exited mid-job with a non-SIGKILL status.
CHILD_EXITED_ERROR_TYPE = "ExtractChildExited"
# Raised when the child is still killed after the reduced-settings retry.
RESOURCE_EXHAUSTED_ERROR_TYPE = "ExtractResourceExhausted"

# Exception types raised inside the extract child that will fail identically on retry.
PERMANENT_SUBPROCESS_ERROR_TYPES: frozenset[str] = frozenset(
    {
        "OverflowError",
        "ValueError",
        "TypeError",
        "UnicodeDecodeError",
        "MemoryError",
        "RecursionError",
        RESOURCE_EXHAUSTED_ERROR_TYPE,
    }
)


def permanent_failure_from_subprocess(
    *,
    error_type: str,
    reason: str,
) -> ExtractPermanentError | None:
    """Classify a child failure by its exception type only (never by message text)."""
    if error_type in PERMANENT_SUBPROCESS_ERROR_TYPES:
        return ExtractPermanentError(reason=reason, error_type=error_type)
    return None
