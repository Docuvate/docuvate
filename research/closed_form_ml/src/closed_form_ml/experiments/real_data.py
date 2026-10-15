# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Load public OCR-ground-truth datasets (HF); never mix eval-only train into shipped weights."""

from __future__ import annotations

import random
from dataclasses import dataclass
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parents[5]

RVL_LABEL_NAMES = [
    "letter",
    "form",
    "email",
    "handwritten",
    "advertisement",
    "scientific_report",
    "scientific_publication",
    "specification",
    "file_folder",
    "news_article",
    "budget",
    "invoice",
    "presentation",
    "questionnaire",
    "resume",
    "memo",
]


@dataclass(frozen=True)
class RvlDocument:
    document_id: str
    text: str
    label_id: str


@dataclass(frozen=True)
class DocVqaExample:
    example_id: str
    question: str
    context_text: str
    answers: tuple[str, ...]


def _rvl_text_from_row(row: dict) -> str:
    paragraphs = row.get("ocr_paragraphs")
    if isinstance(paragraphs, list) and paragraphs:
        return "\n".join(str(p) for p in paragraphs if str(p).strip())
    words = row.get("ocr_words")
    if isinstance(words, list) and words:
        return " ".join(str(w) for w in words if str(w).strip())
    return ""


def load_rvl_cdip_ocr_subset(
    *,
    max_total: int = 2000,
    per_class: int = 125,
    seed: int = 42,
) -> list[RvlDocument]:
    from datasets import load_dataset  # noqa: PLC0415

    ds = load_dataset("HAMMALE/rvl_cdip_OCR", split="train", trust_remote_code=True)
    by_label: dict[int, list] = {i: [] for i in range(16)}
    for idx, row in enumerate(ds):
        label = int(row["label"])
        if label < 0 or label >= 16:
            continue
        if len(by_label[label]) >= per_class:
            continue
        text = _rvl_text_from_row(row)
        if len(text) < 40:
            continue
        by_label[label].append(
            RvlDocument(
                document_id=f"rvl-{label}-{idx}",
                text=text[:8000],
                label_id=RVL_LABEL_NAMES[label],
            )
        )
        if sum(len(v) for v in by_label.values()) >= max_total:
            break
    out: list[RvlDocument] = []
    for items in by_label.values():
        out.extend(items)
    rng = random.Random(seed)
    rng.shuffle(out)
    return out[:max_total]


def load_docvqa_eval_subset(*, max_eval: int = 500, seed: int = 42) -> tuple[list[DocVqaExample], list[DocVqaExample]]:
    """Returns (train_pool, eval_set). Eval only for metrics — do not ship weights trained on DocVQA."""
    from datasets import load_dataset  # noqa: PLC0415

    train_ds = load_dataset("nielsr/docvqa_1200_examples", split="train", trust_remote_code=True)
    test_ds = load_dataset("nielsr/docvqa_1200_examples", split="test", trust_remote_code=True)

    def _convert(row: dict) -> DocVqaExample | None:
        words = row.get("words")
        if not isinstance(words, list):
            return None
        context = " ".join(str(w) for w in words)
        query = row.get("query")
        if isinstance(query, dict):
            question = str(query.get("en") or query.get("de") or "")
        else:
            question = str(query or "")
        answers_raw = row.get("answers") or []
        if isinstance(answers_raw, list):
            answers = tuple(str(a) for a in answers_raw if str(a).strip())
        else:
            answers = (str(answers_raw),)
        if not question.strip() or not context.strip() or not answers:
            return None
        return DocVqaExample(
            example_id=str(row.get("id") or ""),
            question=question.strip(),
            context_text=context[:12000],
            answers=answers,
        )

    train_pool: list[DocVqaExample] = []
    for row in train_ds:
        ex = _convert(row)
        if ex is not None:
            train_pool.append(ex)
    eval_list: list[DocVqaExample] = []
    for row in test_ds:
        ex = _convert(row)
        if ex is not None:
            eval_list.append(ex)
    rng = random.Random(seed)
    if len(eval_list) < max_eval:
        rng.shuffle(train_pool)
        need = max_eval - len(eval_list)
        eval_list.extend(train_pool[:need])
        train_pool = train_pool[need:]
    else:
        eval_list = eval_list[:max_eval]
    rng.shuffle(train_pool)
    return train_pool, eval_list


def load_sroie_train_documents(*, max_docs: int = 400):
    """SROIE (HF darentang/sroie): words + boxes; heuristic key=value line pairs for training."""
    from datasets import load_dataset  # noqa: PLC0415

    import sys

    sys_path = WORKSPACE / "eval"
    if str(sys_path) not in sys.path:
        sys.path.insert(0, str(sys_path))
    from layout_kv_roles.synthetic_corpus import SyntheticDocument, SyntheticEntity  # noqa: PLC0415

    ds = load_dataset("darentang/sroie", split="train", trust_remote_code=True)
    docs: list[SyntheticDocument] = []
    for idx, row in enumerate(ds):
        if len(docs) >= max_docs:
            break
        words = row.get("words") or []
        boxes = row.get("bboxes") or []
        if len(words) < 4:
            continue
        entities: list[SyntheticEntity] = []
        for w_i, (word, box) in enumerate(zip(words, boxes, strict=False)):
            if not str(word).strip():
                continue
            if len(box) >= 4:
                x0, y0, x1, y1 = (float(box[0]), float(box[1]), float(box[2]), float(box[3]))
                x, y = x0 / 1000.0, y0 / 1000.0
                w, h = (x1 - x0) / 1000.0, (y1 - y0) / 1000.0
            else:
                x, y, w, h = 0.1, 0.1, 0.2, 0.05
            role = "key" if str(word).endswith(":") else "value"
            if role == "value" and len(str(word)) < 3:
                role = "other"
            entities.append(
                SyntheticEntity(
                    page=1,
                    x=max(0.0, min(1.0, x)),
                    y=max(0.0, min(1.0, y)),
                    width=max(1e-4, min(1.0, w)),
                    height=max(1e-4, min(1.0, h)),
                    text=str(word).strip(),
                    role=role if role in ("key", "value") else "other",
                )
            )
        links: list[tuple[int, int]] = []
        for e_i, entity in enumerate(entities):
            if entity.role != "key":
                continue
            for v_i in range(e_i + 1, min(e_i + 4, len(entities))):
                if entities[v_i].role == "value":
                    links.append((e_i, v_i))
                    break
        if len(entities) < 2:
            continue
        docs.append(SyntheticDocument(document_id=f"sroie-{idx}", entities=tuple(entities), links=tuple(links)))
    return docs
