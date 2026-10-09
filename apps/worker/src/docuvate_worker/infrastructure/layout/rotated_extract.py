# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Extract rotated text runs from pdfplumber char matrices."""

from __future__ import annotations

import math

from docuvate_worker.domain.layout_ir import LayoutIrBlock, TextAlign
from docuvate_worker.infrastructure.layout.font_map import weight_from_fontname


def _matrix_is_upright(matrix: object) -> bool:
    if not isinstance(matrix, (list, tuple)) or len(matrix) < 4:
        return True
    b = float(matrix[1])
    c = float(matrix[2])
    return abs(b) < 0.05 and abs(c) < 0.05


def _rotation_deg_from_matrix(matrix: tuple[float, ...]) -> float:
    a, b = float(matrix[0]), float(matrix[1])
    return math.degrees(math.atan2(b, a))


def _char_center(char: dict) -> tuple[float, float]:
    return (
        (float(char["x0"]) + float(char["x1"])) / 2.0,
        (float(char["top"]) + float(char["bottom"])) / 2.0,
    )


def _baseline_projection(char: dict) -> float:
    matrix = char.get("matrix")
    cx, cy = _char_center(char)
    if not isinstance(matrix, (list, tuple)) or len(matrix) < 6:
        return cx
    a, b, _, _, e, f = (float(matrix[i]) for i in range(6))
    norm = math.hypot(a, b)
    if norm < 1e-9:
        return cx
    return ((cx - e) * a + (cy - f) * b) / norm


def _axis_keys(char: dict) -> tuple[float, float, tuple[float, float, float, float]]:
    matrix = char.get("matrix")
    if not isinstance(matrix, (list, tuple)) or len(matrix) < 6:
        return 0.0, 0.0, (1.0, 0.0, 0.0, 1.0)
    a, b, c, d, _, _ = (float(matrix[i]) for i in range(6))
    along = _baseline_projection(char)
    cx, cy = _char_center(char)
    norm = math.hypot(a, b)
    perp = (cx * (-b) + cy * a) / norm if norm > 1e-9 else cy
    orient = (round(a, 2), round(b, 2), round(c, 2), round(d, 2))
    return along, perp, orient


def _expand_char_cluster(seed: dict, remaining: list[dict]) -> list[dict]:
    bucket = [seed]
    expanded = True
    while expanded:
        expanded = False
        for char in list(remaining):
            cx, cy = _char_center(char)
            size = float(char.get("size") or 10.0)
            limit = max(size * 1.35, 10.0)
            if any(
                math.hypot(cx - _char_center(other)[0], cy - _char_center(other)[1]) <= limit
                for other in bucket
            ):
                bucket.append(char)
                remaining.remove(char)
                expanded = True
    bucket.sort(key=_baseline_projection)
    if len(bucket) >= 2 and _baseline_projection(bucket[0]) > _baseline_projection(bucket[-1]):
        bucket.reverse()
    return bucket


def _cluster_rotated_chars(chars: list[dict]) -> list[list[dict]]:
    if not chars:
        return []
    orient_groups: dict[tuple[float, float, float, float], list[dict]] = {}
    for char in chars:
        _, _, orient = _axis_keys(char)
        orient_groups.setdefault(orient, []).append(char)
    clusters: list[list[dict]] = []
    for group in orient_groups.values():
        baselines: dict[int, list[dict]] = {}
        for char in group:
            _, perp, _ = _axis_keys(char)
            baselines.setdefault(round(perp / 80.0), []).append(char)
        for baseline_chars in baselines.values():
            remaining = list(baseline_chars)
            while remaining:
                seed = min(
                    remaining, key=lambda c: (_char_center(c)[1], _char_center(c)[0])
                )
                remaining.remove(seed)
                clusters.append(_expand_char_cluster(seed, remaining))
    return clusters


def extract_rotated_blocks(
    page,
    page_num: int,
    page_width: float,
    page_height: float,
    *,
    start_block_index: int,
) -> tuple[list[LayoutIrBlock], int]:
    if page_width <= 0 or page_height <= 0:
        return [], start_block_index

    rotated_chars = [
        c
        for c in page.chars or []
        if not _matrix_is_upright(c.get("matrix"))
    ]
    blocks: list[LayoutIrBlock] = []
    block_index = start_block_index
    for cluster in _cluster_rotated_chars(rotated_chars):
        ordered = sorted(cluster, key=_baseline_projection)
        first_proj = _baseline_projection(ordered[0])
        last_proj = _baseline_projection(ordered[-1])
        if len(ordered) >= 2 and first_proj > last_proj:
            ordered = list(reversed(ordered))
        text = "".join(str(c.get("text") or "") for c in ordered).strip()
        if len(text) < 2:
            continue
        x0 = min(float(c["x0"]) for c in ordered)
        x1 = max(float(c["x1"]) for c in ordered)
        top = min(float(c["top"]) for c in ordered)
        bottom = max(float(c["bottom"]) for c in ordered)
        matrix = ordered[0].get("matrix")
        rotation = (
            _rotation_deg_from_matrix(tuple(float(v) for v in matrix))
            if isinstance(matrix, (list, tuple)) and len(matrix) >= 2
            else None
        )
        sizes = [float(c["size"]) for c in ordered if c.get("size")]
        size_pt = sum(sizes) / len(sizes) if sizes else None
        fontname = ordered[0].get("fontname")
        blocks.append(
            LayoutIrBlock(
                page=page_num,
                x=x0 / page_width,
                y=top / page_height,
                width=max(0.0, (x1 - x0) / page_width),
                height=max(0.0, (bottom - top) / page_height),
                text=text,
                font_family=str(fontname) if fontname else None,
                font_size_pt=size_pt,
                weight=weight_from_fontname(str(fontname) if fontname else None),
                align=TextAlign.LEFT,
                block_index=block_index,
                rotation_deg=rotation,
            )
        )
        block_index += 1
    return blocks, block_index
