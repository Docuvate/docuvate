# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from hashlib import sha256


@dataclass(frozen=True)
class LayoutBlock:
    page: int
    x: float
    y: float
    width: float
    height: float
    text: str
    char_start: int
    char_end: int


@dataclass(frozen=True)
class LayoutDocument:
    doc_id: str
    dataset: str
    split_name: str
    text: str
    blocks: tuple[LayoutBlock, ...]
    width: int
    height: int
    family_id: int
    gt_fields: dict[str, str]
    gt_present: dict[str, bool]


def _quad_bbox_norm(quad: dict[str, float], width: float, height: float) -> tuple[float, float, float, float]:
    xs = [float(quad[k]) for k in ("x1", "x2", "x3", "x4")]
    ys = [float(quad[k]) for k in ("y1", "y2", "y3", "y4")]
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


def cord_family_key(valid_line: list, image_width: int, image_height: int) -> int:
    tops: set[str] = set()
    for line in valid_line:
        if not isinstance(line, dict):
            continue
        cat = line.get("category")
        if isinstance(cat, str) and cat:
            tops.add(cat.split(".")[0])
    sig = (
        tuple(sorted(tops)),
        int(image_width // 80),
        int(image_height // 80),
    )
    digest = sha256(repr(sig).encode()).digest()
    return int.from_bytes(digest[:4], "big")


def sroie_family_key(texts: list[str], bboxes: list, width: int, height: int) -> int:
    grid = [0] * 16
    w = float(width or 1)
    h = float(height or 1)
    for bbox in bboxes[:40]:
        if not bbox:
            continue
        xs = [float(p[0]) for p in bbox]
        ys = [float(p[1]) for p in bbox]
        cx = (min(xs) + max(xs)) * 0.5 / w
        cy = (min(ys) + max(ys)) * 0.5 / h
        ix = min(3, max(0, int(cx * 4)))
        iy = min(3, max(0, int(cy * 4)))
        grid[iy * 4 + ix] += 1
    line_bucket = min(7, len(texts) // 8)
    sig = (tuple(grid), line_bucket, int(w // 100), int(h // 100))
    digest = sha256(repr(sig).encode()).digest()
    return int.from_bytes(digest[:4], "big")


def flatten_gt_parse(obj: object, prefix: str = "") -> dict[str, str]:
    out: dict[str, str] = {}
    if isinstance(obj, dict):
        for key, value in obj.items():
            path = f"{prefix}.{key}" if prefix else str(key)
            out.update(flatten_gt_parse(value, path))
    elif isinstance(obj, list):
        for idx, item in enumerate(obj):
            path = f"{prefix}[{idx}]"
            out.update(flatten_gt_parse(item, path))
    elif obj is not None:
        text = str(obj).strip()
        if text:
            out[prefix] = text
    return out


def cord_canonical_key(field_path: str) -> str:
    lowered = field_path.lower()
    if lowered.endswith(".total_price"):
        return "total_price"
    if ".price" in lowered and "menu" in lowered:
        return "item_price"
    if lowered.endswith(".nm") and "menu" in lowered:
        return "item_name"
    if lowered.endswith(".cnt") and "menu" in lowered:
        return "item_count"
    if "sub_total" in lowered and "price" in lowered:
        return "subtotal"
    if "tax" in lowered and "price" in lowered:
        return "tax"
    if lowered.endswith(".date"):
        return "date"
    if lowered.endswith(".nm") and "menu" not in lowered and "sub_total" not in lowered:
        return "store_name"
    slug = re.sub(r"[^a-z0-9]+", "_", lowered).strip("_")
    return slug or "field"


def cord_document(row: dict, *, doc_id: str, split_name: str) -> LayoutDocument:
    gt_raw = json.loads(row["ground_truth"])
    image = row["image"]
    width = int(getattr(image, "width", 1000) or 1000)
    height = int(getattr(image, "height", 1000) or 1000)
    valid_line = gt_raw.get("valid_line") or []
    family_id = cord_family_key(valid_line, width, height)

    parts: list[str] = []
    blocks: list[LayoutBlock] = []
    cursor = 0
    for line in valid_line:
        if not isinstance(line, dict):
            continue
        words = line.get("words") or []
        texts: list[str] = []
        x0, y0, x1, y1 = 1.0, 1.0, 0.0, 0.0
        for word in words:
            if not isinstance(word, dict):
                continue
            text = str(word.get("text", "")).strip()
            quad = word.get("quad")
            if not text or not isinstance(quad, dict):
                continue
            bx, by, bw, bh = _quad_bbox_norm(quad, float(width), float(height))
            x0 = min(x0, bx)
            y0 = min(y0, by)
            x1 = max(x1, bx + bw)
            y1 = max(y1, by + bh)
            texts.append(text)
        merged = " ".join(texts).strip()
        if not merged or x1 <= x0 or y1 <= y0:
            continue
        if parts:
            parts.append("\n")
            cursor += 1
        char_start = cursor
        parts.append(merged)
        cursor += len(merged)
        blocks.append(
            LayoutBlock(
                page=1,
                x=x0,
                y=y0,
                width=x1 - x0,
                height=y1 - y0,
                text=merged,
                char_start=char_start,
                char_end=cursor,
            )
        )

    flat = flatten_gt_parse(gt_raw.get("gt_parse", {}))
    canonical: dict[str, str] = {}
    for path, value in flat.items():
        canonical[cord_canonical_key(path)] = value

    from dsre_lib.constants import CORD_SCHEMA

    schema_keys = {k for k, _, _ in CORD_SCHEMA}
    gt_present = {key: key in canonical for key in schema_keys}

    return LayoutDocument(
        doc_id=doc_id,
        dataset="cord",
        split_name=split_name,
        text="".join(parts),
        blocks=tuple(blocks),
        width=width,
        height=height,
        family_id=family_id,
        gt_fields=canonical,
        gt_present=gt_present,
    )


def sroie_document(row: dict, *, doc_id: str, split_name: str) -> LayoutDocument:
    image = row["image"]
    width = int(getattr(image, "width", 1000) or 1000)
    height = int(getattr(image, "height", 1000) or 1000)
    objects = row.get("objects") or {}
    texts = objects.get("text") or []
    bboxes = objects.get("bbox") or []
    entities = objects.get("entities") or {}

    family_id = sroie_family_key(list(texts), list(bboxes), width, height)

    parts: list[str] = []
    blocks: list[LayoutBlock] = []
    cursor = 0
    for text, bbox in zip(texts, bboxes, strict=False):
        body = str(text).strip()
        if not body or not bbox:
            continue
        xs = [float(p[0]) for p in bbox]
        ys = [float(p[1]) for p in bbox]
        x0 = min(xs) / float(width)
        x1 = max(xs) / float(width)
        y0 = min(ys) / float(height)
        y1 = max(ys) / float(height)
        if x1 <= x0 or y1 <= y0:
            continue
        if parts:
            parts.append("\n")
            cursor += 1
        char_start = cursor
        parts.append(body)
        cursor += len(body)
        blocks.append(
            LayoutBlock(
                page=1,
                x=x0,
                y=y0,
                width=x1 - x0,
                height=y1 - y0,
                text=body,
                char_start=char_start,
                char_end=cursor,
            )
        )

    gt_fields = {str(k): str(v) for k, v in entities.items() if v}
    from dsre_lib.constants import SROIE_SCHEMA

    schema_keys = {k for k, _, _ in SROIE_SCHEMA}
    gt_present = {key: key in gt_fields for key in schema_keys}

    return LayoutDocument(
        doc_id=doc_id,
        dataset="sroie",
        split_name=split_name,
        text="".join(parts),
        blocks=tuple(blocks),
        width=width,
        height=height,
        family_id=family_id,
        gt_fields=gt_fields,
        gt_present=gt_present,
    )
