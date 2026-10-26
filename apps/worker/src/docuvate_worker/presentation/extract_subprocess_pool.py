# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Long-lived extract children with OCR/ONNX models kept warm between jobs."""

from __future__ import annotations

import json
import logging
import os
import subprocess
import sys
import threading
from dataclasses import dataclass, field
from typing import Any

from docuvate_worker.infrastructure.extract_memory.extract_concurrency import (
    onnx_intra_op_threads_for_concurrency,
    resolve_extract_concurrency,
)
from docuvate_worker.infrastructure.onnx_runtime_env import configure_onnx_runtime_env

logger = logging.getLogger(__name__)

_ENV_POOL = "DOCUVATE_EXTRACT_POOL"
_ENV_POOL_SIZE = "DOCUVATE_EXTRACT_POOL_SIZE"
_ENV_RECYCLE = "DOCUVATE_EXTRACT_POOL_RECYCLE_DOCS"
_DEFAULT_RECYCLE = 40


class _PooledExtractChild:
    def __init__(self, *, intra_op_threads: int) -> None:
        self._lock = threading.Lock()
        self._proc: subprocess.Popen[str] | None = None
        self._jobs_served = 0
        self._recycle_after = int(os.environ.get(_ENV_RECYCLE, str(_DEFAULT_RECYCLE)))
        self._intra_op_threads = intra_op_threads

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
        logger.info("extract_pool_child_started pid=%s", proc.pid)
        return proc

    def _close(self) -> None:
        if self._proc is None:
            return
        try:
            if self._proc.stdin is not None:
                self._proc.stdin.close()
        except OSError:
            pass
        try:
            self._proc.wait(timeout=30)
        except subprocess.TimeoutExpired:
            self._proc.kill()
        stderr = self._proc.stderr.read() if self._proc.stderr is not None else ""
        if stderr.strip():
            logger.warning("extract_pool_child_stderr tail=%s", stderr[-2000:])
        self._proc = None

    def try_acquire(self) -> bool:
        return self._lock.acquire(blocking=False)

    def release_slot(self) -> None:
        self._lock.release()

    def run_job(self, payload: dict[str, Any], *, timeout: float) -> dict[str, Any]:
        with self._lock:
            if self._proc is not None:
                exit_code = self._proc.poll()
                if exit_code is not None:
                    logger.warning(
                        "extract_pool_child_exited code=%s jobs_served=%s",
                        exit_code,
                        self._jobs_served,
                    )
            if self._proc is None or self._proc.poll() is not None:
                self._close()
                self._proc = self._spawn()
            if self._jobs_served >= self._recycle_after:
                logger.info("extract_pool_recycle jobs_served=%s", self._jobs_served)
                self._close()
                self._proc = self._spawn()
            proc = self._proc
            stdin = proc.stdin
            stdout = proc.stdout
            if stdin is None or stdout is None:
                raise RuntimeError("extract pool child missing stdio pipes")
            line = json.dumps(payload)
            stdin.write(line + "\n")
            stdin.flush()
            raw_out = stdout.readline()
            self._jobs_served += 1
            exit_after = proc.poll()
            if exit_after is not None:
                logger.warning(
                    "extract_pool_child_exited_after_job code=%s jobs_served=%s",
                    exit_after,
                    self._jobs_served,
                )
        if not raw_out:
            raise RuntimeError("extract pool child closed stdout")
        envelope = json.loads(raw_out)
        if not isinstance(envelope, dict):
            raise RuntimeError("extract pool child returned non-object JSON")
        return envelope


@dataclass
class _ExtractSubprocessPool:
    children: list[_PooledExtractChild] = field(default_factory=list)
    _assign_lock: threading.Lock = field(default_factory=threading.Lock)
    _wait_lock: threading.Lock = field(default_factory=threading.Lock)
    _idle: threading.Condition = field(default_factory=threading.Condition)

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

    def _acquire_child(self) -> _PooledExtractChild | None:
        with self._assign_lock:
            for child in self.children:
                if child.try_acquire():
                    return child
        return None

    def _release_child(self, child: _PooledExtractChild) -> None:
        child.release_slot()
        with self._wait_lock:
            self._idle.notify_all()


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


def pooled_extract_child() -> _ExtractSubprocessPool:
    with _pool_lock:
        if _pool_registry.pool is None:
            concurrency = _pool_size()
            intra = onnx_intra_op_threads_for_concurrency(concurrency)
            children = [_PooledExtractChild(intra_op_threads=intra) for _ in range(concurrency)]
            _pool_registry.pool = _ExtractSubprocessPool(children=children)
            logger.info(
                "extract_pool_ready size=%s ort_intra_op_threads=%s",
                concurrency,
                intra,
            )
        return _pool_registry.pool
