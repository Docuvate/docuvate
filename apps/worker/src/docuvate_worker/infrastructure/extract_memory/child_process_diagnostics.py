# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Log extract child exits with signal, RSS, and cgroup context."""

from __future__ import annotations

import logging
import signal
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from docuvate_worker.infrastructure.extract_memory.cgroup import (
    cgroup_memory_current_bytes,
    cgroup_memory_limit_bytes,
    cgroup_oom_kill_count,
    read_cgroup_memory_snapshot,
)

logger = logging.getLogger(__name__)

_PROC_STATUS_FIELD_COUNT = 2

ChildExitReason = Literal[
    "planned_recycle",
    "admission_reclaim",
    "replaced_dead_child",
    "exited_before_job",
    "exited_after_job",
    "stdin_closed",
    "unexpected",
    "oom_killed",
]


@dataclass(frozen=True, slots=True)
class ChildExitDiagnostics:
    pid: int | None
    returncode: int | None
    reason: ChildExitReason | str
    rss_bytes: int | None
    signal_name: str | None
    cgroup_limit_bytes: int | None
    cgroup_current_bytes: int | None
    cgroup_oom_kills: int | None
    jobs_served: int | None
    likely_oom_kill: bool


def _read_proc_rss_bytes(pid: int) -> int | None:
    status_path = Path(f"/proc/{pid}/status")
    if not status_path.is_file():
        return None
    for line in status_path.read_text(encoding="utf-8").splitlines():
        if line.startswith("VmRSS:"):
            parts = line.split()
            if len(parts) >= _PROC_STATUS_FIELD_COUNT:
                try:
                    kib = int(parts[1])
                except ValueError:
                    return None
                return kib * 1024
    return None


def _signal_name(returncode: int | None) -> str | None:
    if returncode is None or returncode >= 0:
        return None
    signum = -returncode
    try:
        return signal.Signals(signum).name
    except (ValueError, AttributeError):
        return f"signal_{signum}"


def describe_child_exit(
    proc: subprocess.Popen[str] | None,
    *,
    reason: ChildExitReason | str,
    jobs_served: int | None = None,
) -> ChildExitDiagnostics:
    pid = proc.pid if proc is not None else None
    returncode = proc.poll() if proc is not None else None
    rss = _read_proc_rss_bytes(pid) if pid is not None else None
    snapshot = read_cgroup_memory_snapshot()
    if snapshot is not None:
        cgroup_limit = snapshot.limit_bytes
        cgroup_current = snapshot.current_bytes
    else:
        cgroup_limit = cgroup_memory_limit_bytes()
        cgroup_current = cgroup_memory_current_bytes()
    signal_name = _signal_name(returncode)
    oom_kills = cgroup_oom_kill_count()
    likely_oom = signal_name == "SIGKILL" and oom_kills is not None and oom_kills > 0
    exit_reason: ChildExitReason | str = reason
    if likely_oom and reason not in {"planned_recycle", "admission_reclaim"}:
        exit_reason = "oom_killed"
    return ChildExitDiagnostics(
        pid=pid,
        returncode=returncode,
        reason=exit_reason,
        rss_bytes=rss,
        signal_name=signal_name,
        cgroup_limit_bytes=cgroup_limit,
        cgroup_current_bytes=cgroup_current,
        cgroup_oom_kills=oom_kills,
        jobs_served=jobs_served,
        likely_oom_kill=likely_oom,
    )


def log_child_exit(diagnostics: ChildExitDiagnostics) -> None:
    rss_mib = (
        round(diagnostics.rss_bytes / (1024 * 1024), 1)
        if diagnostics.rss_bytes is not None
        else None
    )
    log_fn = logger.error if diagnostics.likely_oom_kill else logger.warning
    log_fn(
        "extract_pool_child_exit reason=%s pid=%s code=%s signal=%s rss_mib=%s "
        "jobs_served=%s cgroup_current_mib=%s cgroup_limit_mib=%s cgroup_oom_kills=%s "
        "likely_oom_kill=%s",
        diagnostics.reason,
        diagnostics.pid,
        diagnostics.returncode,
        diagnostics.signal_name,
        rss_mib,
        diagnostics.jobs_served,
        (
            round(diagnostics.cgroup_current_bytes / (1024 * 1024), 1)
            if diagnostics.cgroup_current_bytes is not None
            else None
        ),
        (
            round(diagnostics.cgroup_limit_bytes / (1024 * 1024), 1)
            if diagnostics.cgroup_limit_bytes is not None
            else None
        ),
        diagnostics.cgroup_oom_kills,
        diagnostics.likely_oom_kill,
    )
