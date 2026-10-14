#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Run held-out answer-type eval (manual / nightly bench; not PR CI)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORKER_SRC = ROOT / "apps" / "worker" / "src"
for entry in (str(ROOT), str(WORKER_SRC)):
    if entry not in sys.path:
        sys.path.insert(0, entry)

from bench.model_gates.gates.chat_answer_type import run_chat_answer_type_gate


def main() -> int:
    gate = run_chat_answer_type_gate()
    payload = {
        "gate_id": gate.gate_id,
        "status": gate.status,
        "detail": gate.detail,
        "metrics": {m.name: m.value for m in gate.metrics},
    }
    print(json.dumps(payload, indent=2))
    return 0 if gate.status == "ok" else 1


if __name__ == "__main__":
    raise SystemExit(main())
