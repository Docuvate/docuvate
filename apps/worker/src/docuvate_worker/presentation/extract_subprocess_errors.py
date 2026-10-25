# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import signal

_BENIGN_STDERR_MARKERS: tuple[str, ...] = (
    "Failed to persist telemetry device ID",
    "telemetry_1ds.cc",
    "[W:onnxruntime:Default, telemetry_1ds.cc",
)


def _signal_name(signum: int) -> str:
    try:
        return signal.Signals(signum).name
    except (ValueError, AttributeError):
        return f"signal {signum}"


def filter_benign_stderr(stderr: str | None) -> str:
    if not stderr:
        return ""
    kept: list[str] = []
    for line in stderr.splitlines():
        if any(marker in line for marker in _BENIGN_STDERR_MARKERS):
            continue
        stripped = line.strip()
        if stripped:
            kept.append(stripped)
    return "\n".join(kept)


def meaningful_stderr_tail(stderr: str | None, *, max_lines: int = 12) -> str:
    filtered = filter_benign_stderr(stderr)
    if not filtered:
        return ""
    lines = filtered.splitlines()
    if len(lines) <= max_lines:
        return "\n".join(lines)
    return "\n".join(lines[-max_lines:])


def subprocess_failure_message(
    returncode: int,
    stderr: str | None,
    *,
    stdout_snippet: str | None = None,
) -> str:
    if returncode < 0:
        signum = -returncode
        name = _signal_name(signum)
        if signum == signal.SIGKILL:
            base = f"extract subprocess killed by {name} (likely out of memory)"
        else:
            base = f"extract subprocess killed by {name}"
    else:
        base = f"extract subprocess exited with code {returncode}"

    detail = meaningful_stderr_tail(stderr)
    if detail:
        return f"{base}: {detail}"
    if stdout_snippet and stdout_snippet.strip():
        snippet = stdout_snippet.strip()[:400]
        return f"{base} (stdout: {snippet!r})"
    return base
