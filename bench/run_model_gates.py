#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""CLI entry for Docuvate CE model-gates harness."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORKER_SRC = ROOT / "apps" / "worker" / "src"
WORKER_ROOT = ROOT / "apps" / "worker"
for entry in (str(ROOT), str(WORKER_SRC), str(WORKER_ROOT)):
    if entry not in sys.path:
        sys.path.insert(0, entry)

from bench.model_gates.runner import main

if __name__ == "__main__":
    raise SystemExit(main())
