# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Configure ONNX Runtime before sessions are created (telemetry noise, log level)."""

from __future__ import annotations

import os


def configure_onnx_runtime_env() -> None:
    """Idempotent env defaults; safe to call before importing ``onnxruntime``."""
    os.environ.setdefault("ORT_DISABLE_ALL_TELEMETRY", "1")
    os.environ.setdefault("ORT_Telemetry_1DS_Enabled", "0")
    os.environ.setdefault("ORT_LOG_SEVERITY_LEVEL", "3")
    try:
        import onnxruntime as ort  # noqa: PLC0415

        ort.set_default_logger_severity(3)
    except ImportError:
        pass
