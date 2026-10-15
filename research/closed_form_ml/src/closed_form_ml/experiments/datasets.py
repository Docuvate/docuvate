# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parents[5]


@dataclass(frozen=True)
class TextExample:
    document_id: str
    text: str
    label_id: str


def load_classification_fixtures(*, holdout_label: str = "werkstattbericht") -> tuple[list[TextExample], list[TextExample]]:
    path = WORKSPACE / "bench" / "model_gates" / "fixtures" / "classification_texts.json"
    payload = json.loads(path.read_text(encoding="utf-8"))
    train: list[TextExample] = []
    test: list[TextExample] = []
    for ex in payload["examples"]:
        item = TextExample(ex["document_id"], ex["text"], ex["label_id"])
        if ex["label_id"] == holdout_label:
            test.append(item)
        else:
            train.append(item)
    return train, test


def load_rvl_cdip_subset(*, max_per_class: int = 40, max_classes: int = 8, seed: int = 0) -> list[TextExample]:
    """Feasibility: HF RVL-CDIP OCR text field if datasets installed; else empty."""
    try:
        from datasets import load_dataset  # noqa: PLC0415
    except ImportError:
        return []
    try:
        ds = load_dataset("rvl_cdip", split="train", streaming=True)
    except Exception:
        return []
    import random

    rng = random.Random(seed)
    per_class: dict[str, list[TextExample]] = {}
    for row in ds:
        label_idx = int(row.get("label", -1))
        label_id = f"rvl-{label_idx}"
        if label_id not in per_class and len(per_class) >= max_classes:
            continue
        bucket = per_class.setdefault(label_id, [])
        if len(bucket) >= max_per_class:
            if len(per_class) >= max_classes and all(len(v) >= max_per_class for v in per_class.values()):
                break
            continue
        text = str(row.get("text") or row.get("ocr_text") or "").strip()
        if len(text) < 40:
            continue
        doc_id = str(row.get("id") or f"{label_id}-{len(bucket)}")
        bucket.append(TextExample(doc_id, text[:2000], label_id))
    out: list[TextExample] = []
    for items in per_class.values():
        out.extend(items)
    rng.shuffle(out)
    return out


def load_chat_extractive_cases(*, max_cases: int = 80) -> list[dict]:
    path = WORKSPACE / "bench" / "model_gates" / "fixtures" / "chat_extractive_cases.json"
    payload = json.loads(path.read_text(encoding="utf-8"))
    cases = [c for c in payload["cases"] if c.get("kind") == "answerable"]
    return cases[:max_cases]
