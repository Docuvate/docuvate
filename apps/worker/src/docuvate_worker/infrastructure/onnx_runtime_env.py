# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Configure ONNX Runtime before sessions are created (telemetry noise, log level)."""

from __future__ import annotations

import os

import onnxruntime as ort


def configure_onnx_runtime_env() -> None:
    """Idempotent env defaults; safe to call before creating InferenceSessions."""
    os.environ.setdefault("ORT_DISABLE_ALL_TELEMETRY", "1")
    os.environ.setdefault("ORT_Telemetry_1DS_Enabled", "0")
    os.environ.setdefault("ORT_LOG_SEVERITY_LEVEL", "3")
    if os.environ.get("DOCUVATE_ORT_DISABLE_MEM_ARENA", "1") == "1":
        os.environ.setdefault("ORT_DISABLE_CPU_MEM_ARENA", "1")
    intra = os.environ.get("DOCUVATE_ORT_INTRA_OP_THREADS", "").strip()
    if intra.isdigit() and int(intra) > 0:
        os.environ.setdefault("OMP_NUM_THREADS", intra)
    ort.set_default_logger_severity(3)


def apply_onnx_session_options(options: ort.SessionOptions) -> None:
    """Thread and arena limits shared by encoder and RapidOCR sessions."""
    intra_raw = os.environ.get("DOCUVATE_ORT_INTRA_OP_THREADS", "2").strip()
    intra = int(intra_raw) if intra_raw.isdigit() and int(intra_raw) > 0 else 2
    options.intra_op_num_threads = intra
    options.inter_op_num_threads = 1
    if os.environ.get("DOCUVATE_ORT_DISABLE_MEM_ARENA", "1") == "1":
        options.enable_cpu_mem_arena = False
