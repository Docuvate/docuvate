# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from docuvate_worker.domain.representation.constants import EMBEDDING_DIM

SHAPE_BINS = 8
NEIGHBOR_DIRECTIONS = ("left", "right", "up", "down")
LAYOUT_SCALAR_DIM = 4 + SHAPE_BINS
NEIGHBOR_FEATURE_DIM = 4  # has, dx, dy, cos_sim
ENTITY_FEATURE_DIM = (
    EMBEDDING_DIM + LAYOUT_SCALAR_DIM + len(NEIGHBOR_DIRECTIONS) * NEIGHBOR_FEATURE_DIM
)
LINK_EXTRA_DIM = 3  # delta_x, delta_y, same_row


@dataclass(frozen=True)
class LayoutEntity:
    index: int
    page: int
    x: float
    y: float
    width: float
    height: float
    text: str
    embedding: tuple[float, ...]


def _center(entity: LayoutEntity) -> tuple[float, float]:
    return (entity.x + entity.width * 0.5, entity.y + entity.height * 0.5)


def shape_bin_index(width: float, height: float) -> int:
    safe_h = max(height, 1e-4)
    ratio = width / safe_h
    log_ratio = float(np.log10(max(ratio, 1e-3)))
    clipped = min(max(log_ratio + 1.0, 0.0), 1.999)
    return int(clipped * (SHAPE_BINS / 2.0)) % SHAPE_BINS


def shape_one_hot(width: float, height: float) -> list[float]:
    out = [0.0] * SHAPE_BINS
    out[shape_bin_index(width, height)] = 1.0
    return out


def _same_page_entities(entity: LayoutEntity, entities: list[LayoutEntity]) -> list[LayoutEntity]:
    return [
        other
        for other in entities
        if other.page == entity.page and other.index != entity.index
    ]


def _pick_neighbor(
    entity: LayoutEntity,
    candidates: list[LayoutEntity],
    direction: str,
) -> LayoutEntity | None:
    cx, cy = _center(entity)
    best: LayoutEntity | None = None
    best_dist = float("inf")
    for other in candidates:
        ox, oy = _center(other)
        if direction == "left" and ox >= cx:
            continue
        if direction == "right" and ox <= cx:
            continue
        if direction == "up" and oy >= cy:
            continue
        if direction == "down" and oy <= cy:
            continue
        dist = (ox - cx) ** 2 + (oy - cy) ** 2
        if dist < best_dist:
            best_dist = dist
            best = other
    return best


def _cosine(a: tuple[float, ...], b: tuple[float, ...]) -> float:
    va = np.asarray(a, dtype=np.float32)
    vb = np.asarray(b, dtype=np.float32)
    denom = float(np.linalg.norm(va) * np.linalg.norm(vb))
    if denom <= 0:
        return 0.0
    return float(np.dot(va, vb) / denom)


def entity_feature_vector(entity: LayoutEntity, entities: list[LayoutEntity]) -> list[float]:
    if len(entity.embedding) != EMBEDDING_DIM:
        msg = f"expected embedding dim {EMBEDDING_DIM}, got {len(entity.embedding)}"
        raise ValueError(msg)
    features: list[float] = list(entity.embedding)
    features.extend([entity.x, entity.y, entity.width, entity.height])
    features.extend(shape_one_hot(entity.width, entity.height))
    cx, cy = _center(entity)
    page_candidates = _same_page_entities(entity, entities)
    for direction in NEIGHBOR_DIRECTIONS:
        neighbor = _pick_neighbor(entity, page_candidates, direction)
        if neighbor is None:
            features.extend([0.0, 0.0, 0.0, 0.0])
            continue
        nx, ny = _center(neighbor)
        features.extend([1.0, nx - cx, ny - cy, _cosine(entity.embedding, neighbor.embedding)])
    if len(features) != ENTITY_FEATURE_DIM:
        msg = f"entity feature dim mismatch: {len(features)} != {ENTITY_FEATURE_DIM}"
        raise ValueError(msg)
    return features


def link_feature_vector(key_entity: LayoutEntity, value_entity: LayoutEntity) -> list[float]:
    key_vec = entity_feature_vector(key_entity, [key_entity, value_entity])
    value_vec = entity_feature_vector(value_entity, [key_entity, value_entity])
    kcx, kcy = _center(key_entity)
    vcx, vcy = _center(value_entity)
    same_row = 1.0 if abs(kcy - vcy) <= max(key_entity.height, value_entity.height) * 0.75 else 0.0
    extra = [vcx - kcx, vcy - kcy, same_row]
    combined = key_vec + value_vec + extra
    expected = ENTITY_FEATURE_DIM * 2 + LINK_EXTRA_DIM
    if len(combined) != expected:
        msg = f"link feature dim mismatch: {len(combined)} != {expected}"
        raise ValueError(msg)
    return combined


def batch_entity_features(entities: list[LayoutEntity]) -> NDArray[np.float32]:
    matrix = np.asarray(
        [entity_feature_vector(entity, entities) for entity in entities],
        dtype=np.float32,
    )
    return matrix
