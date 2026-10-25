# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Long-lived extract child with OCR/ONNX models kept warm between jobs."""

from __future__ import annotations

import json
import logging
import os
import subprocess
import sys
import threading
from dataclasses import dataclass
from typing import Any

from docuvate_worker.infrastructure.onnx_runtime_env import configure_onnx_runtime_env

logger = logging.getLogger(__name__)

_ENV_POOL = "DOCUVATE_EXTRACT_POOL"
_ENV_RECYCLE = "DOCUVATE_EXTRACT_POOL_RECYCLE_DOCS"
_DEFAULT_RECYCLE = 40


class _PooledExtractChild:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._proc: subprocess.Popen[str] | None = None
        self._jobs_served = 0
        self._recycle_after = int(os.environ.get(_ENV_RECYCLE, str(_DEFAULT_RECYCLE)))

    def _spawn(self) -> subprocess.Popen[str]:
        configure_onnx_runtime_env()
        env = os.environ.copy()
        env["DOCUVATE_EXTRACT_CHILD_LOOP"] = "1"
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

    def run_job(self, payload: dict[str, Any], *, timeout: float) -> dict[str, Any]:
        with self._lock:
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
        if not raw_out:
            raise RuntimeError("extract pool child closed stdout")
        envelope = json.loads(raw_out)
        if not isinstance(envelope, dict):
            raise RuntimeError("extract pool child returned non-object JSON")
        return envelope


@dataclass
class _PoolRegistry:
    child: _PooledExtractChild | None = None


_pool_registry = _PoolRegistry()
_pool_lock = threading.Lock()


def extract_pool_enabled() -> bool:
    return os.environ.get(_ENV_POOL, "0") == "1"


def pooled_extract_child() -> _PooledExtractChild:
    with _pool_lock:
        if _pool_registry.child is None:
            _pool_registry.child = _PooledExtractChild()
        return _pool_registry.child
