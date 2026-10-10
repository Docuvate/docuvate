# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Cluster pdfplumber chars into typographic runs (pdf2htmlEX-style fidelity)."""

from __future__ import annotations

import math

from docuvate_worker.domain.layout_ir import LayoutIrBlock, TextAlign
from docuvate_worker.infrastructure.layout.font_map import weight_from_fontname
from docuvate_worker.infrastructure.layout.rotated_extract import (
    _cluster_rotated_chars,
    _matrix_is_upright,
)


def _char_center(char: dict) -> tuple[float, float]:
    return (
        (float(char["x0"]) + float(char["x1"])) / 2.0,
        (float(char["top"]) + float(char["bottom"])) / 2.0,
    )


def _matrix_tuple(char: dict) -> tuple[float, float, float, float, float, float]:
    raw = char.get("matrix")
    if not isinstance(raw, (list, tuple)) or len(raw) < 6:  # noqa: PLR2004
        return (1.0, 0.0, 0.0, 1.0, float(char["x0"]), float(char["top"]))
    return tuple(float(raw[i]) for i in range(6))


def _matrix_key(matrix: tuple[float, ...]) -> tuple[float, float, float, float]:
    return (round(matrix[0], 3), round(matrix[1], 3), round(matrix[2], 3), round(matrix[3], 3))


def _color_key(char: dict) -> tuple[float, float, float] | None:
    raw = char.get("non_stroking_color")
    if isinstance(raw, (list, tuple)) and len(raw) >= 3:  # noqa: PLR2004
        return (round(float(raw[0]), 2), round(float(raw[1]), 2), round(float(raw[2]), 2))
    if isinstance(raw, (int, float)):
        g = round(float(raw), 2)
        return (g, g, g)
    return None


def _style_key(char: dict) -> tuple:
    size = float(char.get("size") or 10.0)
    font = str(char.get("fontname") or "")
    return (font, round(size, 2), _matrix_key(_matrix_tuple(char)), _color_key(char))


def _reading_projection(char: dict) -> float:
    matrix = _matrix_tuple(char)
    a, b, _, _, e, f = matrix
    cx, cy = _char_center(char)
    return cx * a + cy * b + e * 0.01 + f * 0.01


def _baseline_distance(a: dict, b: dict) -> float:
    ma, mb = _matrix_tuple(a), _matrix_tuple(b)
    ax, ay = _char_center(a)
    bx, by = _char_center(b)
    perp_a = ax * (-ma[1]) + ay * ma[0]
    perp_b = bx * (-mb[1]) + by * mb[0]
    return abs(perp_a - perp_b)


def _rotation_deg(matrix: tuple[float, ...]) -> float | None:
    a, b = matrix[0], matrix[1]
    deg = math.degrees(math.atan2(b, a))
    if abs(deg) < 1.0:
        return None
    return deg


def _baseline_bucket(char: dict) -> int:
    matrix = _matrix_tuple(char)
    cx, cy = _char_center(char)
    perp = cx * (-matrix[1]) + cy * matrix[0]
    size = float(char.get("size") or 10.0)
    return round(perp / max(size * 0.75, 5.0))


def _cluster_upright_chars(chars: list[dict]) -> list[list[dict]]:
    if not chars:
        return []
    by_style: dict[tuple, list[dict]] = {}
    for char in chars:
        by_style.setdefault(_style_key(char), []).append(char)
    clusters: list[list[dict]] = []
    for group in by_style.values():
        by_baseline: dict[int, list[dict]] = {}
        for char in group:
            by_baseline.setdefault(_baseline_bucket(char), []).append(char)
        for baseline_chars in by_baseline.values():
            ordered = sorted(baseline_chars, key=lambda c: (float(c["x0"]), float(c["top"])))
            bucket: list[dict] = []
            for char in ordered:
                if not bucket:
                    bucket = [char]
                    continue
                prev = bucket[-1]
                size = float(prev.get("size") or 10.0)
                x_gap = float(char["x0"]) - float(prev["x1"])
                if x_gap <= max(size * 0.45, 2.5) and _baseline_distance(char, prev) <= max(
                    size * 0.65, 5.0
                ):
                    bucket.append(char)
                else:
                    clusters.append(bucket)
                    bucket = [char]
            if bucket:
                clusters.append(bucket)
    return clusters


def _upright_x0(char: dict) -> float:
    return float(char["x0"])


def _along_text_axis(char: dict) -> float:
    matrix = _matrix_tuple(char)
    a, b, _, _, e, f = matrix
    cx, cy = _char_center(char)
    norm = math.hypot(a, b)
    if norm < 1e-9:  # noqa: PLR2004
        return cx
    return ((cx - e) * a + (cy - f) * b) / norm


def _center_distance(a: dict, b: dict) -> float:
    ax, ay = _char_center(a)
    bx, by = _char_center(b)
    return math.hypot(bx - ax, by - ay)


def _gap_along_reading(prev: dict, char: dict) -> float:
    ma = _matrix_tuple(prev)
    if abs(ma[1]) < 0.05 and abs(ma[2]) < 0.05:  # noqa: PLR2004
        return float(char["x0"]) - float(prev["x1"])
    return _center_distance(prev, char)


def _join_cluster_text(cluster: list[dict]) -> str:
    matrix = _matrix_tuple(cluster[0])
    reverse_reading = (
        not _matrix_is_upright(cluster[0].get("matrix")) and matrix[1] < -0.05  # noqa: PLR2004
    )
    sort_key = _upright_x0 if _matrix_is_upright(cluster[0].get("matrix")) else _along_text_axis
    ordered = sorted(cluster, key=sort_key, reverse=reverse_reading)
    parts: list[str] = []
    for idx, char in enumerate(ordered):
        piece = str(char.get("text") or "")
        if not piece:
            continue
        if idx > 0:
            prev = ordered[idx - 1]
            gap = _gap_along_reading(prev, char)
            size = float(prev.get("size") or 10.0)
            if gap > max(size * 1.15, 6.5):
                parts.append(" ")
        parts.append(piece)
    return "".join(parts)


def _pdf_origin_top(page_height: float, matrix: tuple[float, ...]) -> float:
    """Baseline/text origin Y in pdfplumber top-down pt space."""
    _, _, _, _, _e, f = matrix
    return page_height - float(f)


def _blocks_from_clusters(
    clusters: list[list[dict]],
    *,
    page_num: int,
    page_width: float,
    page_height: float,
    start_block_index: int,
    min_rotated_len: int = 2,
) -> tuple[list[LayoutIrBlock], int]:
    blocks: list[LayoutIrBlock] = []
    block_index = start_block_index
    for cluster in clusters:
        text = _join_cluster_text(cluster).strip()
        if not text:
            continue
        first = cluster[0]
        matrix = _matrix_tuple(first)
        rotation = _rotation_deg(matrix)
        if rotation is not None and len(text.replace(" ", "")) < min_rotated_len:
            continue
        x0 = min(float(c["x0"]) for c in cluster)
        x1 = max(float(c["x1"]) for c in cluster)
        top = min(float(c["top"]) for c in cluster)
        bottom = max(float(c["bottom"]) for c in cluster)
        fontname = cluster[0].get("fontname")
        sizes = [float(c["size"]) for c in cluster if c.get("size")]
        size_pt = sum(sizes) / len(sizes) if sizes else None
        color = _color_key(first)
        origin_x = float(matrix[4])
        origin_y = _pdf_origin_top(page_height, matrix)
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
                matrix=matrix,
                text_rgb=color,
                text_origin_x=origin_x / page_width,
                text_origin_y=origin_y / page_height,
            )
        )
        block_index += 1
    return blocks, block_index


def extract_text_runs(
    page,
    page_num: int,
    page_width: float,
    page_height: float,
    *,
    start_block_index: int,
) -> tuple[list[LayoutIrBlock], int]:
    if page_width <= 0 or page_height <= 0:
        return [], start_block_index
    chars = [
        c
        for c in (page.chars or [])
        if c.get("text") is not None and str(c.get("text")) != ""
    ]
    upright_chars = [c for c in chars if _matrix_is_upright(c.get("matrix"))]
    rotated_chars = [c for c in chars if not _matrix_is_upright(c.get("matrix"))]

    blocks: list[LayoutIrBlock] = []
    block_index = start_block_index
    upright_clusters = _cluster_upright_chars(upright_chars)
    blocks, block_index = _blocks_from_clusters(
        upright_clusters,
        page_num=page_num,
        page_width=page_width,
        page_height=page_height,
        start_block_index=block_index,
    )
    rotated_clusters = _cluster_rotated_chars(rotated_chars)
    rot_blocks, block_index = _blocks_from_clusters(
        rotated_clusters,
        page_num=page_num,
        page_width=page_width,
        page_height=page_height,
        start_block_index=block_index,
        min_rotated_len=2,
    )
    blocks.extend(rot_blocks)
    return blocks, block_index
