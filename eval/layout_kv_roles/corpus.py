# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Convert CORD / FUNSD / XFUND rows into layout KV training documents."""

from __future__ import annotations

import json
import math
import re
from typing import Literal, Sequence

from layout_kv_roles.synthetic_corpus import SyntheticDocument, SyntheticEntity

RoleLabel = Literal["other", "key", "value"]

_VALUE_CATEGORY_SUFFIXES = (
    ".price",
    ".total",
    ".subtotal",
    ".tax",
    ".amount",
)
_KEY_CATEGORY_SUFFIXES = (
    ".nm",
    ".name",
    ".num",
    ".date",
    ".addr",
    ".tel",
    ".itemsubno",
    ".cnt",
)


def _quad_bbox_norm(quad: dict[str, float], width: float, height: float) -> tuple[float, float, float, float]:
    xs = [float(quad["x1"]), float(quad["x2"]), float(quad["x3"]), float(quad["x4"])]
    ys = [float(quad["y1"]), float(quad["y2"]), float(quad["y3"]), float(quad["y4"])]
    x0 = min(xs) / width
    x1 = max(xs) / width
    y0 = min(ys) / height
    y1 = max(ys) / height
    return (
        max(0.0, min(1.0, x0)),
        max(0.0, min(1.0, y0)),
        max(0.0, min(1.0, x1 - x0)),
        max(0.0, min(1.0, y1 - y0)),
    )


def _cord_category_role(category: str) -> RoleLabel:
    lowered = category.lower()
    if any(lowered.endswith(suffix) for suffix in _VALUE_CATEGORY_SUFFIXES):
        return "value"
    if any(lowered.endswith(suffix) for suffix in _KEY_CATEGORY_SUFFIXES):
        return "key"
    if lowered.startswith("menu.") and "price" in lowered:
        return "value"
    return "other"


def cord_document_from_ground_truth(
    document_id: str,
    ground_truth: str,
    *,
    image_width: int,
    image_height: int,
) -> SyntheticDocument | None:
    payload = json.loads(ground_truth)
    valid_line = payload.get("valid_line")
    if not isinstance(valid_line, list):
        return None
    width = float(image_width or 1)
    height = float(image_height or 1)
    entities: list[SyntheticEntity] = []
    group_indices: dict[int, list[int]] = {}
    for line in valid_line:
        if not isinstance(line, dict):
            continue
        words = line.get("words")
        category = line.get("category")
        group_id = line.get("group_id")
        if not isinstance(words, list) or not isinstance(category, str):
            continue
        texts: list[str] = []
        x0 = 1.0
        y0 = 1.0
        x1 = 0.0
        y1 = 0.0
        for word in words:
            if not isinstance(word, dict):
                continue
            text = word.get("text")
            quad = word.get("quad")
            if not isinstance(text, str) or not isinstance(quad, dict):
                continue
            texts.append(text.strip())
            bx, by, bw, bh = _quad_bbox_norm(quad, width, height)
            x0 = min(x0, bx)
            y0 = min(y0, by)
            x1 = max(x1, bx + bw)
            y1 = max(y1, by + bh)
        merged = " ".join(t for t in texts if t).strip()
        if not merged or x1 <= x0 or y1 <= y0:
            continue
        role = _cord_category_role(category)
        entity = SyntheticEntity(
            page=1,
            x=x0,
            y=y0,
            width=x1 - x0,
            height=y1 - y0,
            text=merged,
            role=role,
        )
        idx = len(entities)
        entities.append(entity)
        if isinstance(group_id, int):
            group_indices.setdefault(group_id, []).append(idx)
    links: list[tuple[int, int]] = []
    for indices in group_indices.values():
        keys = [i for i in indices if entities[i].role == "key"]
        values = [i for i in indices if entities[i].role == "value"]
        if not keys or not values:
            continue
        for key_idx in keys:
            value_idx = min(values, key=lambda i: _center_distance(entities[key_idx], entities[i]))
            links.append((key_idx, value_idx))
    if len(entities) < 2:
        return None
    return SyntheticDocument(document_id=document_id, entities=tuple(entities), links=tuple(links))


def load_cord_train_documents(*, max_docs: int | None = None) -> list[SyntheticDocument]:
    from datasets import load_dataset  # noqa: PLC0415

    split = "train" if max_docs is None else f"train[:{max_docs}]"
    rows = load_dataset("naver-clova-ix/cord-v2", split=split)
    documents: list[SyntheticDocument] = []
    for idx, row in enumerate(rows):
        image = row.get("image")
        width = int(getattr(image, "width", 1000) or 1000)
        height = int(getattr(image, "height", 1000) or 1000)
        doc = cord_document_from_ground_truth(
            f"cord-train-{idx}",
            str(row.get("ground_truth", "")),
            image_width=width,
            image_height=height,
        )
        if doc is not None:
            documents.append(doc)
    return documents


_NER_LABELS = ["O", "B-HEADER", "I-HEADER", "B-QUESTION", "I-QUESTION", "B-ANSWER", "I-ANSWER"]


def _bbox_norm(bbox: Sequence[int], width: float, height: float) -> tuple[float, float, float, float]:
    x0, y0, x1, y1 = (float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3]))
    if x1 > x0 + 1.0 and y1 > y0 + 1.0:
        # 0–1000 normalized layoutlm boxes
        x = x0 / 1000.0
        y = y0 / 1000.0
        w = (x1 - x0) / 1000.0
        h = (y1 - y0) / 1000.0
    else:
        x = x0 / width
        y = y0 / height
        w = (x1 - x0) / width
        h = (y1 - y0) / height
    return (
        max(0.0, min(1.0, x)),
        max(0.0, min(1.0, y)),
        max(0.0, min(1.0, w)),
        max(0.0, min(1.0, h)),
    )


def _center_distance(left: SyntheticEntity, right: SyntheticEntity) -> float:
    lx = left.x + left.width * 0.5
    ly = left.y + left.height * 0.5
    rx = right.x + right.width * 0.5
    ry = right.y + right.height * 0.5
    return (lx - rx) ** 2 + (ly - ry) ** 2


def _group_ner_document(
    document_id: str,
    words: list[str],
    bboxes: list[list[int]],
    ner_tags: list[int],
    *,
    image_width: int,
    image_height: int,
) -> SyntheticDocument | None:
    entities: list[SyntheticEntity] = []
    idx = 0
    while idx < len(words):
        tag_id = ner_tags[idx]
        if tag_id < 0 or tag_id >= len(_NER_LABELS):
            idx += 1
            continue
        tag = _NER_LABELS[tag_id]
        if tag == "O":
            idx += 1
            continue
        if not tag.startswith("B-"):
            idx += 1
            continue
        label_type = tag[2:]
        start = idx
        idx += 1
        while idx < len(words):
            next_tag = _NER_LABELS[ner_tags[idx]]
            if next_tag != f"I-{label_type}":
                break
            idx += 1
        chunk_words = words[start:idx]
        text = " ".join(w.strip() for w in chunk_words if w.strip())
        if not text:
            continue
        xs: list[float] = []
        ys: list[float] = []
        x2s: list[float] = []
        y2s: list[float] = []
        for pos in range(start, idx):
            x, y, w, h = _bbox_norm(bboxes[pos], float(image_width), float(image_height))
            xs.append(x)
            ys.append(y)
            x2s.append(x + w)
            y2s.append(y + h)
        if not xs:
            continue
        x0 = min(xs)
        y0 = min(ys)
        role: RoleLabel
        if label_type == "QUESTION":
            role = "key"
        elif label_type == "ANSWER":
            role = "value"
        else:
            role = "other"
        entities.append(
            SyntheticEntity(
                page=1,
                x=x0,
                y=y0,
                width=max(min(1.0, max(x2s) - x0), 1e-4),
                height=max(min(1.0, max(y2s) - y0), 1e-4),
                text=text,
                role=role,
            )
        )
    if len(entities) < 2:
        return None
    links = _spatial_gold_links(entities)
    return SyntheticDocument(document_id=document_id, entities=tuple(entities), links=tuple(links))


def _spatial_gold_links(entities: list[SyntheticEntity]) -> list[tuple[int, int]]:
    keys = [idx for idx, entity in enumerate(entities) if entity.role == "key"]
    values = [idx for idx, entity in enumerate(entities) if entity.role == "value"]
    used_values: set[int] = set()
    pairs: list[tuple[int, int]] = []
    for key_idx in sorted(keys, key=lambda i: (entities[i].y, entities[i].x)):
        best_value: int | None = None
        best_score = math.inf
        key_entity = entities[key_idx]
        kcx = key_entity.x + key_entity.width * 0.5
        kcy = key_entity.y + key_entity.height * 0.5
        for value_idx in values:
            if value_idx in used_values:
                continue
            value_entity = entities[value_idx]
            vcx = value_entity.x + value_entity.width * 0.5
            vcy = value_entity.y + value_entity.height * 0.5
            if vcx + 0.02 < kcx and abs(vcy - kcy) > 0.03:
                continue
            score = _center_distance(key_entity, value_entity)
            if score < best_score:
                best_score = score
                best_value = value_idx
        if best_value is not None:
            used_values.add(best_value)
            pairs.append((key_idx, best_value))
    return pairs


def load_funsd_documents(*, split: Literal["test"] = "test", max_docs: int | None = None) -> list[SyntheticDocument]:
    from datasets import load_dataset  # noqa: PLC0415

    spec = split if max_docs is None else f"{split}[:{max_docs}]"
    rows = load_dataset("nielsr/funsd", split=spec)
    documents: list[SyntheticDocument] = []
    for idx, row in enumerate(rows):
        image = row["image"]
        doc = _group_ner_document(
            f"funsd-{split}-{idx}",
            [str(w) for w in row["words"]],
            row["bboxes"],
            row["ner_tags"],
            image_width=int(image.width),
            image_height=int(image.height),
        )
        if doc is not None:
            documents.append(doc)
    return documents


def load_xfund_de_documents(
    *,
    split: Literal["validation"] = "validation",
    max_docs: int | None = None,
) -> list[SyntheticDocument]:
    from datasets import load_dataset  # noqa: PLC0415

    spec = split if max_docs is None else f"{split}[:{max_docs}]"
    rows = load_dataset("moritzbur/xfund", "de", split=spec, trust_remote_code=True)
    documents: list[SyntheticDocument] = []
    for idx, row in enumerate(rows):
        image = row["image"]
        tokens = row.get("tokens") or row.get("words") or []
        doc = _group_ner_document(
            f"xfund-de-{split}-{idx}",
            [str(w) for w in tokens],
            row["bboxes"],
            row["ner_tags"],
            image_width=int(image.width),
            image_height=int(image.height),
        )
        if doc is not None:
            documents.append(doc)
    return documents
