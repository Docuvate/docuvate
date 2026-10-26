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


def permanent_failure_from_subprocess(
    *,
    error_type: str,
    reason: str,
) -> ExtractPermanentError | None:
    lowered = reason.casefold()
    if error_type in {"OverflowError", "ValueError", "TypeError", "UnicodeDecodeError"}:
        return ExtractPermanentError(reason=reason, error_type=error_type)
    if "overflowerror" in lowered or "math range error" in lowered:
        return ExtractPermanentError(reason=reason, error_type=error_type)
    if "extractresourceexhausted" in lowered or "zu groß" in lowered:
        return ExtractPermanentError(reason=reason, error_type="ExtractResourceExhausted")
    if "out of memory" in lowered or "sigkill" in lowered:
        return ExtractPermanentError(reason=reason, error_type="ExtractResourceExhausted")
    if error_type in {"MemoryError", "RecursionError"}:
        return ExtractPermanentError(reason=reason, error_type=error_type)
    return None
