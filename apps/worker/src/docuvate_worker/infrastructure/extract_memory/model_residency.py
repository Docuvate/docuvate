# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Whether OCR / ONNX / DocAI models stay loaded between extraction jobs."""

from __future__ import annotations

import os


def extract_keep_models_resident() -> bool:
    """Keep inference models loaded across jobs (pooled extract child loop)."""
    raw = os.environ.get("DOCUVATE_EXTRACT_KEEP_MODELS", "").strip().casefold()
    if raw:
        return raw in {"1", "true", "yes", "on"}
    return os.environ.get("DOCUVATE_EXTRACT_CHILD_LOOP") == "1"
