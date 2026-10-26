# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Long-lived extract children with OCR/ONNX models kept warm between jobs."""

from __future__ import annotations

import json
import logging
import os
import select
import subprocess
import sys
import threading
import time
from dataclasses import dataclass, field
from typing import Any, IO

from docuvate_worker.domain.extract_errors import ExtractRetryableError
from docuvate_worker.infrastructure.extract_memory.child_process_diagnostics import (
    describe_child_exit,
    log_child_exit,
)
from docuvate_worker.infrastructure.extract_memory.extract_concurrency import (
    onnx_intra_op_threads_for_concurrency,
    resolve_extract_concurrency,
)
from docuvate_worker.infrastructure.extract_memory.memory_pressure import should_defer_pool_recycle
from docuvate_worker.infrastructure.extract_memory.pool_memory import (
    pool_memory_registry,
    pool_resident_bytes_per_child,
)
from docuvate_worker.infrastructure.onnx_runtime_env import configure_onnx_runtime_env
from docuvate_worker.presentation.extract_active import attach_pool_child_to_active

logger = logging.getLogger(__name__)

_ENV_POOL = "DOCUVATE_EXTRACT_POOL"
_ENV_POOL_SIZE = "DOCUVATE_EXTRACT_POOL_SIZE"
_ENV_RECYCLE = "DOCUVATE_EXTRACT_POOL_RECYCLE_DOCS"
_ENV_CANCEL_GRACE = "DOCUVATE_EXTRACT_CANCEL_GRACE_SECONDS"
_DEFAULT_RECYCLE = 40
_DEFAULT_CANCEL_GRACE = 5.0
_CANCEL_LINE = json.dumps({"__docuvate_op": "cancel"})


def _cancel_grace_seconds() -> float:
    raw = os.environ.get(_ENV_CANCEL_GRACE, str(_DEFAULT_CANCEL_GRACE))
    try:
        parsed = float(raw)
    except ValueError:
        return _DEFAULT_CANCEL_GRACE
    return parsed if parsed > 0 else _DEFAULT_CANCEL_GRACE


def _readline_with_timeout(stream: IO[str], timeout: float) -> str | None:
    if timeout <= 0:
        return None
    ready, _, _ = select.select([stream], [], [], timeout)
    if not ready:
        return None
    line = stream.readline()
    if not line:
        return None
    return line


class PooledExtractChild:
    def __init__(self, *, intra_op_threads: int) -> None:
        self._lock = threading.RLock()
        self._proc: subprocess.Popen[str] | None = None
        self._jobs_served = 0
        self._recycle_after = int(os.environ.get(_ENV_RECYCLE, str(_DEFAULT_RECYCLE)))
        self._intra_op_threads = intra_op_threads
        self._cancel_requested = threading.Event()

    def _spawn(self) -> subprocess.Popen[str]:
        configure_onnx_runtime_env()
        env = os.environ.copy()
        env["DOCUVATE_EXTRACT_CHILD_LOOP"] = "1"
        env["DOCUVATE_EXTRACT_KEEP_MODELS"] = "1"
        env["DOCUVATE_ORT_INTRA_OP_THREADS"] = str(self._intra_op_threads)
        proc = subprocess.Popen(
            [sys.executable, "-m", "docuvate_worker.presentation.extract_subprocess_runner"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            env=env,
        )
        self._jobs_served = 0
        pool_memory_registry().register_spawned_child()
        logger.info("extract_pool_child_started pid=%s", proc.pid)
        self._start_stderr_drainer(proc)
        return proc

    def _start_stderr_drainer(self, proc: subprocess.Popen[str]) -> None:
        stderr = proc.stderr
        if stderr is None:
            return

        def _drain() -> None:
            try:
                for line in stderr:
                    stripped = line.strip()
                    if stripped:
                        logger.debug(
                            "extract_pool_child_stderr pid=%s line=%s",
                            proc.pid,
                            stripped[:500],
                        )
            except OSError:
                return

        threading.Thread(
            target=_drain,
            name=f"extract-pool-stderr-{proc.pid}",
            daemon=True,
        ).start()

    def _log_exit(self, proc: subprocess.Popen[str] | None, reason: str) -> None:
        log_child_exit(
            describe_child_exit(
                proc,
                reason=reason,
                jobs_served=self._jobs_served,
            )
        )

    def is_warm(self) -> bool:
        return self._proc is not None and self._proc.poll() is None

    def shutdown_warm_process(self, *, reason: str) -> bool:
        """Terminate the warm child process; caller must hold this child's lock."""
        if not self.is_warm():
            return False
        self._close(reason=reason)
        return True

    def _close(self, *, reason: str) -> None:
        if self._proc is None:
            return
        proc = self._proc
        self._proc = None
        self._log_exit(proc, reason)
        try:
            if proc.stdin is not None:
                proc.stdin.close()
        except OSError:
            pass
        try:
            proc.wait(timeout=30)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait(timeout=10)
        stderr = proc.stderr.read() if proc.stderr is not None else ""
        if stderr.strip():
            logger.warning("extract_pool_child_stderr tail=%s", stderr[-2000:])
        pool_memory_registry().unregister_spawned_child()

    def try_acquire(self) -> bool:
        return self._lock.acquire(blocking=False)

    def release_slot(self) -> None:
        self._lock.release()

    def request_cancel(self) -> None:
        self._cancel_requested.set()
        proc = self._proc
        if proc is None or proc.stdin is None:
            return
        try:
            proc.stdin.write(_CANCEL_LINE + "\n")
            proc.stdin.flush()
        except OSError:
            return

    def bind_subprocess_for_testing(self, proc: subprocess.Popen[str]) -> None:
        """Test hook: attach a mock child process without spawning."""
        self._proc = proc

    def run_job(self, payload: dict[str, Any], *, timeout: float) -> dict[str, Any]:
        self._cancel_requested.clear()
        attach_pool_child_to_active(self)
        with self._lock:
            if self._proc is not None and self._proc.poll() is not None:
                self._close(reason="exited_before_job")
            if self._proc is None:
                self._proc = self._spawn()
            if self._jobs_served >= self._recycle_after:
                if should_defer_pool_recycle():
                    logger.info(
                        "extract_pool_recycle_deferred jobs_served=%s memory_pressure=1",
                        self._jobs_served,
                    )
                else:
                    logger.info("extract_pool_recycle jobs_served=%s", self._jobs_served)
                    self._close(reason="planned_recycle")
                    self._proc = self._spawn()
            proc = self._proc
            stdin = proc.stdin
            stdout = proc.stdout
            if stdin is None or stdout is None:
                raise RuntimeError("extract pool child missing stdio pipes")
            line = json.dumps(payload)
            try:
                stdin.write(line + "\n")
                stdin.flush()
            except BrokenPipeError:
                self._log_exit(proc, "broken_pipe_on_write")
                self._close(reason="broken_pipe_on_write")
                raise RuntimeError("extract pool child stdin broken (pipe EOF)") from None
            deadline = time.monotonic() + timeout
            remaining = max(0.0, deadline - time.monotonic())
            raw_out = _readline_with_timeout(stdout, remaining)
            if raw_out is None and (
                self._cancel_requested.is_set() or time.monotonic() >= deadline
            ):
                self.request_cancel()
                grace = _cancel_grace_seconds()
                raw_out = _readline_with_timeout(stdout, grace)
            if raw_out is None:
                reason = (
                    "client disconnected"
                    if self._cancel_requested.is_set()
                    else "extract deadline exceeded"
                )
                self._close(reason="deadline_exceeded")
                raise ExtractRetryableError(
                    reason=reason,
                    error_type="ExtractDeadlineExceeded",
                )
            self._jobs_served += 1
            exit_after = proc.poll()
            if exit_after is not None:
                self._log_exit(proc, "exited_after_job")
        if not raw_out:
            raise RuntimeError("extract pool child closed stdout")
        envelope = json.loads(raw_out)
        if not isinstance(envelope, dict):
            raise RuntimeError("extract pool child returned non-object JSON")
        return envelope


@dataclass
class _ExtractSubprocessPool:
    children: list[PooledExtractChild] = field(default_factory=list)
    _assign_lock: threading.Lock = field(default_factory=threading.Lock)
    _wait_lock: threading.Lock = field(default_factory=threading.Lock)
    _idle: threading.Condition = field(init=False, repr=False)

    def __post_init__(self) -> None:
        self._idle = threading.Condition(self._wait_lock)

    def run_job(self, payload: dict[str, Any], *, timeout: float) -> dict[str, Any]:
        while True:
            child = self._acquire_child()
            if child is not None:
                try:
                    return child.run_job(payload, timeout=timeout)
                finally:
                    self._release_child(child)
            with self._wait_lock:
                self._idle.wait(timeout=0.05)

    def _acquire_child(self) -> PooledExtractChild | None:
        with self._assign_lock:
            for child in self.children:
                if child.try_acquire():
                    return child
        return None

    def _release_child(self, child: PooledExtractChild) -> None:
        child.release_slot()
        with self._wait_lock:
            self._idle.notify_all()

    def evict_idle_children(self, *, keep_warm: int) -> int:
        """Close idle warm children; return estimated bytes reclaimed."""
        resident = pool_resident_bytes_per_child()
        reclaimed = 0
        with self._assign_lock:
            warm_count = sum(1 for child in self.children if child.is_warm())
            for child in self.children:
                if warm_count <= keep_warm:
                    break
                if not child.try_acquire():
                    continue
                try:
                    if child.shutdown_warm_process(reason="admission_reclaim"):
                        reclaimed += resident
                        warm_count -= 1
                finally:
                    child.release_slot()
        if reclaimed > 0:
            logger.info(
                "extract_pool_evicted_idle reclaimed_mib=%.1f keep_warm=%s",
                reclaimed / (1024 * 1024),
                keep_warm,
            )
        return reclaimed


@dataclass
class _PoolRegistry:
    pool: _ExtractSubprocessPool | None = None


_pool_registry = _PoolRegistry()
_pool_lock = threading.Lock()


def extract_pool_enabled() -> bool:
    return os.environ.get(_ENV_POOL, "0") == "1"


def _pool_size() -> int:
    raw = os.environ.get(_ENV_POOL_SIZE, "").strip()
    if raw.isdigit() and int(raw) > 0:
        return int(raw)
    return resolve_extract_concurrency()


def evict_idle_pool_children(keep: int = 0) -> int:
    if not extract_pool_enabled():
        return 0
    return pooled_extract_child().evict_idle_children(keep_warm=keep)


def pooled_extract_child() -> _ExtractSubprocessPool:
    with _pool_lock:
        if _pool_registry.pool is None:
            concurrency = _pool_size()
            intra = onnx_intra_op_threads_for_concurrency(concurrency)
            children = [PooledExtractChild(intra_op_threads=intra) for _ in range(concurrency)]
            _pool_registry.pool = _ExtractSubprocessPool(children=children)
            logger.info(
                "extract_pool_ready size=%s ort_intra_op_threads=%s",
                concurrency,
                intra,
            )
        return _pool_registry.pool
