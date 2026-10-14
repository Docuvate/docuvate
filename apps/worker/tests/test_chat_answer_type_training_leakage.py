# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import json
from pathlib import Path


def _normalize_question(text: str) -> str:
    return " ".join(text.strip().split()).casefold()


def test_chat_answer_type_training_excludes_smoke_manifest_questions() -> None:
    root = Path(__file__).resolve().parents[3]
    manifest = json.loads(
        (root / "tools/smoke-bench/manifest.json").read_text(encoding="utf-8")
    )
    training = json.loads(
        (root / "bench/model_gates/fixtures/chat_answer_type_training.json").read_text(
            encoding="utf-8"
        )
    )
    smoke_questions = {
        _normalize_question(str(row["question"]))
        for row in manifest.get("chatChecks", [])
        if isinstance(row, dict) and row.get("question")
    }
    assert smoke_questions, "expected smoke chatChecks questions"
    types_raw = training.get("answer_types", {})
    assert isinstance(types_raw, dict)
    training_phrases: list[str] = []
    for phrases in types_raw.values():
        if isinstance(phrases, list):
            training_phrases.extend(str(p) for p in phrases)
    normalized_training = {_normalize_question(p) for p in training_phrases}
    overlap = smoke_questions & normalized_training
    assert not overlap, f"training must not contain smoke questions: {sorted(overlap)}"
