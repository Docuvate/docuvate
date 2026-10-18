# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Best-effort return of native heap (Paddle/ONNX) to the interpreter after heavy work."""

from __future__ import annotations

import gc


def reclaim_python_heap() -> None:
    gc.collect()
