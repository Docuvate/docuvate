# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Log why PID 1 (uvicorn) is shutting down — e.g. SIGTERM after failed liveness probes."""

from __future__ import annotations

import logging
import os
import signal
import threading

from docuvate_worker.infrastructure.extract_memory.cgroup import (
    cgroup_memory_current_bytes,
    cgroup_memory_limit_bytes,
    cgroup_oom_kill_count,
)

logger = logging.getLogger(__name__)
_installed = False


def _cgroup_summary() -> str:
    limit = cgroup_memory_limit_bytes()
    current = cgroup_memory_current_bytes()
    oom = cgroup_oom_kill_count()
    limit_mib = round(limit / (1024 * 1024), 1) if limit is not None else None
    current_mib = round(current / (1024 * 1024), 1) if current is not None else None
    return f"limit_mib={limit_mib} current_mib={current_mib} oom_kills={oom}"


def _handle_shutdown_signal(signum: int, _frame: object | None) -> None:
    try:
        name = signal.Signals(signum).name
    except (ValueError, AttributeError):
        name = str(signum)
    logger.warning(
        "worker_shutdown_signal signum=%s name=%s pid=%s thread=%s %s",
        signum,
        name,
        os.getpid(),
        threading.current_thread().name,
        _cgroup_summary(),
    )
    raise SystemExit(0)


def install_worker_shutdown_audit() -> None:
    global _installed
    if _installed:
        return
    signal.signal(signal.SIGTERM, _handle_shutdown_signal)
    signal.signal(signal.SIGINT, _handle_shutdown_signal)
    _installed = True
    logger.info("worker_shutdown_audit_installed pid=%s", os.getpid())
