# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import json
import sys
from pathlib import Path

from docuvate_worker.infrastructure.fastembed_model import embed_query

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from bench.model_gates.gates.chat_answer_type import _classify

AMOUNT_SMOKE_IDS = frozenset({"fact", "payslip-gross-oct-2024", "lohnsteuer-2024"})


def test_smoke_manifest_amount_checks_classify_as_amount() -> None:
    proto = json.loads(
        (
            ROOT
            / "apps/api/src/modules/cited-chat/domain/chat-answer-type-prototypes.json"
        ).read_text(encoding="utf-8")
    )
    manifest = json.loads(
        (ROOT / "tools/smoke-bench/manifest.json").read_text(encoding="utf-8")
    )
    embed_query("warmup")
    for row in manifest.get("chatChecks", []):
        if not isinstance(row, dict):
            continue
        check_id = str(row.get("id", ""))
        if check_id not in AMOUNT_SMOKE_IDS:
            continue
        question = str(row.get("question", "")).strip()
        assert question
        predicted = _classify(embed_query(question), proto)
        assert predicted == "amount", f"{check_id}: {question!r} -> {predicted}"
