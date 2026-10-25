# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Layout feature builders for DocAI D v0.3 (parity with training reference)."""

from __future__ import annotations

import math
import unicodedata
from collections.abc import Callable
from typing import Protocol, TypedDict

import numpy as np
from numpy.typing import NDArray

FloatArray = NDArray[np.float32]

_ROW_OVERLAP_THRESHOLD = 0.5
_HORIZONTAL_ALIGN_TOLERANCE = 2.0
_MAX_NEIGHBOR_KNN = 4
_PAIR_FEAT_EXTRA = 12


class PcaTransformProtocol(Protocol):
    def transform(self, matrix: FloatArray) -> FloatArray: ...


class NeighborFeatureCache(TypedDict, total=False):
    nb: tuple[
        list[list[int | None]],
        FloatArray,
        FloatArray,
        FloatArray,
    ]


class LayoutUnit(TypedDict):
    text: str
    box: list[float]


class LayoutDocumentCore(TypedDict):
    w: float
    h: float
    units: list[LayoutUnit]


class LayoutDocument(LayoutDocumentCore, total=False):
    E: FloatArray
    G: FloatArray
    rows: list[list[int]]
    y: list[str]


def digits(text: str) -> str:
    return "".join(character for character in text if character.isdigit())


def node_geom(document: LayoutDocumentCore) -> tuple[FloatArray, list[list[int]]]:
    units = document["units"]
    count = len(units)
    if count == 0:
        return np.zeros((0, 22), np.float32), [[] for _ in range(0)]
    boxes = np.array([unit["box"] for unit in units], float)
    page_width = document["w"]
    page_height = document["h"]
    heights = np.clip(boxes[:, 3] - boxes[:, 1], 1, None)
    median_height = np.median(heights)
    center_y = (boxes[:, 1] + boxes[:, 3]) / 2
    center_x = (boxes[:, 0] + boxes[:, 2]) / 2
    order = np.argsort(np.argsort(center_y)) / max(count - 1, 1)
    row_groups: list[list[int]] = []
    for index in range(count):
        overlap = np.clip(
            np.minimum(boxes[index, 3], boxes[:, 3]) - np.maximum(boxes[index, 1], boxes[:, 1]),
            0,
            None,
        ) / np.minimum(heights[index], heights)
        row_groups.append(list(np.where(overlap > _ROW_OVERLAP_THRESHOLD)[0]))
    features: list[list[float]] = []
    for index, unit in enumerate(units):
        text = unit["text"]
        text_len = max(len(text), 1)
        row = row_groups[index]
        row_array = np.asarray(row, dtype=np.intp)
        sorted_row = list(row_array[np.argsort(boxes[row_array, 0])])
        position = sorted_row.index(index)
        numeric = digits(text)
        stripped = text.strip()
        is_number = float(
            len(numeric) > 0
            and all(character.isdigit() or character in ",.- " for character in stripped)
        )
        digit_value = (
            float("".join(str(unicodedata.digit(character)) for character in numeric[-12:]))
            if numeric
            else 0
        )
        features.append(
            [
                boxes[index, 0] / page_width,
                boxes[index, 1] / page_height,
                boxes[index, 2] / page_width,
                boxes[index, 3] / page_height,
                center_x[index] / page_width,
                center_y[index] / page_height,
                (boxes[index, 2] - boxes[index, 0]) / page_width,
                heights[index] / median_height,
                order[index],
                math.log1p(count),
                math.log1p(len(text)),
                len(numeric) / text_len,
                sum(character.isalpha() for character in text) / text_len,
                sum(character.isupper() for character in text) / text_len,
                text.count(" ") / text_len,
                is_number,
                math.log1p(digit_value),
                len(row),
                position / max(len(row) - 1, 1),
                float(position == len(row) - 1),
                float(position == 0),
                (boxes[index, 2] - boxes[:, 2].max()) / page_width,
            ]
        )
    return np.array(features, np.float32), row_groups


def node_ctx(
    document: LayoutDocument,
    geometry: FloatArray,
    embeddings: FloatArray,
    rows: list[list[int]],
) -> FloatArray:
    units = document["units"]
    count = len(units)
    boxes = np.array([unit["box"] for unit in units], float).reshape(-1, 4)
    center_y = (boxes[:, 1] + boxes[:, 3]) / 2
    context_rows: list[FloatArray] = []
    embedding_width = embeddings.shape[1]
    geometry_width = geometry.shape[1]
    zero_embedding = np.zeros(embedding_width, np.float32)
    zero_geometry = np.zeros(geometry_width, np.float32)
    for index in range(count):
        row = [neighbor for neighbor in rows[index] if neighbor != index]
        left = [
            neighbor
            for neighbor in row
            if boxes[neighbor, 2] <= boxes[index, 0] + _HORIZONTAL_ALIGN_TOLERANCE
        ]
        right = [
            neighbor
            for neighbor in row
            if boxes[neighbor, 0] >= boxes[index, 2] - _HORIZONTAL_ALIGN_TOLERANCE
        ]
        left_idx = max(left, key=lambda neighbor: boxes[neighbor, 2]) if left else None
        right_idx = min(right, key=lambda neighbor: boxes[neighbor, 0]) if right else None
        above = [
            neighbor
            for neighbor in range(count)
            if center_y[neighbor] < boxes[index, 1] and neighbor not in rows[index]
        ]
        below = [
            neighbor
            for neighbor in range(count)
            if center_y[neighbor] > boxes[index, 3] and neighbor not in rows[index]
        ]
        above_idx = max(above, key=lambda neighbor: center_y[neighbor]) if above else None
        below_idx = min(below, key=lambda neighbor: center_y[neighbor]) if below else None
        context_rows.append(
            np.concatenate(
                [
                    geometry[left_idx] if left_idx is not None else zero_geometry,
                    embeddings[left_idx] if left_idx is not None else zero_embedding,
                    [left_idx is None],
                    geometry[right_idx] if right_idx is not None else zero_geometry,
                    embeddings[right_idx] if right_idx is not None else zero_embedding,
                    [right_idx is None],
                    embeddings[above_idx] if above_idx is not None else zero_embedding,
                    embeddings[below_idx] if below_idx is not None else zero_embedding,
                ]
            )
        )
    return np.array(context_rows, np.float32).reshape(count, -1)


def cand_sets(
    document: LayoutDocument,
    probabilities: FloatArray,
    classes: list[str],
    source: str,
    destination: str,
    threshold: float,
    *,
    oracle: bool = False,
) -> tuple[list[int], list[int]]:
    labels = document.get("y")
    if labels is None:
        msg = "LayoutDocument requires y labels for candidate selection"
        raise ValueError(msg)
    if oracle:
        sources = [index for index, label in enumerate(labels) if label == source]
        targets = [index for index, label in enumerate(labels) if label == destination]
        return sources, targets
    source_index = classes.index(source)
    destination_index = classes.index(destination)
    label_count = len(labels)
    sources = [
        index
        for index in range(label_count)
        if probabilities[index, source_index] >= threshold
    ]
    targets = [
        index
        for index in range(label_count)
        if probabilities[index, destination_index] >= threshold
    ]
    return sources, targets


def pair_feats(
    document: LayoutDocument,
    probabilities: FloatArray,
    sources: list[int],
    targets: list[int],
    pca: PcaTransformProtocol,
) -> tuple[FloatArray, list[tuple[int, int]]]:
    boxes = np.array([unit["box"] for unit in document["units"]], float)
    median_height = max(np.median(boxes[:, 3] - boxes[:, 1]), 1)
    page_width = document["w"]
    page_height = document["h"]
    center_y = (boxes[:, 1] + boxes[:, 3]) / 2
    center_x = (boxes[:, 0] + boxes[:, 2]) / 2
    embedding_matrix = document.get("E")
    geometry_matrix = document.get("G")
    if embedding_matrix is None or geometry_matrix is None:
        msg = "LayoutDocument requires E and G embeddings for pair features"
        raise ValueError(msg)
    if len(embedding_matrix):
        projected = pca.transform(embedding_matrix)
        node = np.hstack([geometry_matrix, probabilities, projected])
    else:
        node = np.hstack([geometry_matrix, probabilities])
    pairs: list[tuple[int, int]] = []
    feature_rows: list[FloatArray] = []
    for target_index in targets:
        distances = np.array(
            [abs(center_y[source_index] - center_y[target_index]) for source_index in sources]
        )
        rank: NDArray[np.intp] = (
            np.argsort(np.argsort(distances)) if len(sources) else np.empty(0, dtype=np.intp)
        )
        for rank_value, source_index in zip(rank, sources, strict=False):
            if source_index == target_index:
                continue
            low = min(center_y[source_index], center_y[target_index])
            high = max(center_y[source_index], center_y[target_index])
            vertical_overlap = (
                min(boxes[source_index, 3], boxes[target_index, 3])
                - max(boxes[source_index, 1], boxes[target_index, 1])
            )
            min_heights = min(
                boxes[source_index, 3] - boxes[source_index, 1],
                boxes[target_index, 3] - boxes[target_index, 1],
            )
            overlap = max(0, vertical_overlap) / max(min_heights, 1)
            neighbors_target = sum(
                low < center_y[other] < high for other in targets if other != target_index
            )
            neighbors_source = sum(
                low < center_y[other] < high for other in sources if other != source_index
            )
            feature_rows.append(
                np.concatenate(
                    [
                        node[source_index],
                        node[target_index],
                        [
                            (center_y[target_index] - center_y[source_index]) / median_height,
                            abs(center_y[target_index] - center_y[source_index]) / median_height,
                            (boxes[target_index, 1] - boxes[source_index, 1]) / median_height,
                            (boxes[target_index, 0] - boxes[source_index, 2]) / page_width,
                            (center_x[target_index] - center_x[source_index]) / page_width,
                            overlap,
                            float(boxes[target_index, 0] >= boxes[source_index, 0]),
                            rank_value,
                            neighbors_target,
                            neighbors_source,
                            float(
                                embedding_matrix[source_index] @ embedding_matrix[target_index]
                            ),
                            np.hypot(
                                (center_x[target_index] - center_x[source_index]) / page_width,
                                (center_y[target_index] - center_y[source_index]) / page_height,
                            ),
                        ],
                    ]
                )
            )
            pairs.append((source_index, target_index))
    if not feature_rows:
        return np.zeros((0, 2 * node.shape[1] + _PAIR_FEAT_EXTRA), np.float32), pairs
    return np.array(feature_rows, np.float32), pairs


def decode(
    meta: list[tuple[int, int, int]],
    scores: FloatArray,
    document_count: int,
    threshold: float,
    *,
    source_cap: int = 1,
) -> list[list[tuple[int, int, float]]]:
    output: list[list[tuple[int, int, float]]] = [[] for _ in range(document_count)]
    order = np.argsort(-scores)
    used_targets: set[tuple[int, int]] = set()
    used_sources: dict[tuple[int, int], int] = {}
    for key in order:
        if scores[key] < threshold:
            break
        doc_index, source_index, target_index = meta[key]
        source_uses = used_sources.get((doc_index, source_index), 0)
        if (doc_index, target_index) in used_targets or source_uses >= source_cap:
            continue
        used_targets.add((doc_index, target_index))
        used_sources[(doc_index, source_index)] = used_sources.get((doc_index, source_index), 0) + 1
        output[doc_index].append((source_index, target_index, float(scores[key])))
    return output


def dir_nbrs(
    document: LayoutDocument,
    rows: list[list[int]],
) -> tuple[list[list[int | None]], FloatArray, FloatArray, FloatArray]:
    units = document["units"]
    count = len(units)
    boxes = np.array([unit["box"] for unit in units], float).reshape(-1, 4)
    center_y = (boxes[:, 1] + boxes[:, 3]) / 2
    center_x = (boxes[:, 0] + boxes[:, 2]) / 2
    neighbors: list[list[int | None]] = []

    def vertical_best(
        candidates: list[int],
        unit_index: int,
        key: Callable[[int], float],
    ) -> int | None:
        if not candidates:
            return None
        overlapping = [
            candidate
            for candidate in candidates
            if min(boxes[unit_index, 2], boxes[candidate, 2])
            - max(boxes[unit_index, 0], boxes[candidate, 0])
            > 0
        ]
        return min(overlapping or candidates, key=key)

    for index in range(count):
        row = [neighbor for neighbor in rows[index] if neighbor != index]
        row_set = set(rows[index])
        left = [
            neighbor
            for neighbor in row
            if boxes[neighbor, 2] <= boxes[index, 0] + _HORIZONTAL_ALIGN_TOLERANCE
        ]
        right = [
            neighbor
            for neighbor in row
            if boxes[neighbor, 0] >= boxes[index, 2] - _HORIZONTAL_ALIGN_TOLERANCE
        ]
        above = [
            neighbor
            for neighbor in range(count)
            if center_y[neighbor] < boxes[index, 1] and neighbor not in row_set
        ]
        below = [
            neighbor
            for neighbor in range(count)
            if center_y[neighbor] > boxes[index, 3] and neighbor not in row_set
        ]
        def left_key(neighbor: int) -> float:
            return float(boxes[neighbor, 2])

        def right_key(neighbor: int) -> float:
            return float(boxes[neighbor, 0])

        def above_key(neighbor: int, unit_index: int = index) -> float:
            return float(boxes[unit_index, 1] - center_y[neighbor])

        def below_key(neighbor: int, unit_index: int = index) -> float:
            return float(center_y[neighbor] - boxes[unit_index, 3])

        neighbors.append(
            [
                max(left, key=left_key) if left else None,
                min(right, key=right_key) if right else None,
                vertical_best(above, index, above_key),
                vertical_best(below, index, below_key),
            ]
        )
    return neighbors, boxes, center_x, center_y


def nbr_feats(
    document: LayoutDocument,
    probabilities: FloatArray,
    cache: NeighborFeatureCache,
) -> FloatArray:
    count = len(document["units"])
    class_count = probabilities.shape[1]
    if count == 0:
        return np.zeros((0, 4 * (class_count + 2) + 2 * class_count + 1), np.float32)
    layout_rows = document.get("rows")
    if layout_rows is None:
        msg = "LayoutDocument requires rows for neighbor features"
        raise ValueError(msg)
    if "nb" not in cache:
        cache["nb"] = dir_nbrs(document, layout_rows)
    neighbor_indices, _boxes, center_x, center_y = cache["nb"]
    page_width = document["w"]
    page_height = document["h"]
    feature_rows: list[list[float]] = []
    x_delta = (center_x[:, None] - center_x[None]) / page_width
    y_delta = (center_y[:, None] - center_y[None]) / page_height
    distances = np.hypot(x_delta, y_delta)
    np.fill_diagonal(distances, np.inf)
    for index in range(count):
        row_features: list[float] = []
        for neighbor in neighbor_indices[index]:
            if neighbor is None:
                row_features.extend([0.0] * class_count + [1.0, 1.0])
            else:
                distance_value = float(distances[index, neighbor])
                neighbor_probabilities = [*probabilities[neighbor], 0.0, distance_value]
                row_features.extend(neighbor_probabilities)
        knn_limit = min(_MAX_NEIGHBOR_KNN, count - 1)
        knn: NDArray[np.intp] = (
            np.argsort(distances[index])[:knn_limit]
            if count > 1
            else np.empty(0, dtype=np.intp)
        )
        row_features.extend(list(probabilities[knn].mean(0)) if len(knn) else [0.0] * class_count)
        row_features.extend(list(probabilities[index]))
        row_features.append(float(distances[index, knn[0]]) if len(knn) else 1.0)
        feature_rows.append(row_features)
    return np.array(feature_rows, np.float32)
