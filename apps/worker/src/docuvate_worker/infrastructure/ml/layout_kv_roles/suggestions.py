# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import re

from docuvate_worker.domain.models import ExtractedField, ExtractionBlock
from docuvate_worker.domain.representation.encode import DocumentRepresentation, EncodedUnit
from docuvate_worker.domain.representation.quantize import dequantize_vector
from docuvate_worker.infrastructure.ml.layout_kv_roles.features import (
    LayoutEntity,
    entity_feature_vector,
    link_feature_vector,
)
from docuvate_worker.infrastructure.ml.layout_kv_roles.model import (
    LayoutKvRoleHeadModel,
    get_layout_kv_role_head,
    predict_link_probability,
    predict_role,
)

_SLUG_RE = re.compile(r"[^a-z0-9]+")
_MIN_LAYOUT_ENTITIES = 2


def slug_field_key(label_text: str) -> str:
    lowered = label_text.strip().lower()
    slug = _SLUG_RE.sub("_", lowered).strip("_")
    return slug or "field"


def _normalize_catalog_key(key: str) -> str:
    return key.strip().lower().replace("-", "").replace("_", "")


def _entities_from_representation(
    blocks: list[ExtractionBlock],
    representation: DocumentRepresentation | None,
) -> list[LayoutEntity]:
    if not blocks:
        return []
    block_units: list[tuple[ExtractionBlock, EncodedUnit]] = []
    if representation is not None:
        units_by_text: dict[str, EncodedUnit] = {}
        for encoded in representation.units:
            if encoded.unit.kind != "paragraph":
                continue
            units_by_text[encoded.unit.text.strip()] = encoded
        for block in blocks:
            body = block.text.strip()
            if not body:
                continue
            encoded_unit = units_by_text.get(body)
            if encoded_unit is None:
                continue
            block_units.append((block, encoded_unit))
    entities: list[LayoutEntity] = []
    for idx, (block, encoded) in enumerate(block_units):
        vector = dequantize_vector(encoded.scale, encoded.vector_int8)
        entities.append(
            LayoutEntity(
                index=idx,
                page=block.page,
                x=block.x,
                y=block.y,
                width=block.width,
                height=block.height,
                text=block.text.strip(),
                embedding=tuple(float(v) for v in vector.tolist()),
            )
        )
    return entities


def _filter_existing_keys(
    suggestions: list[ExtractedField],
    *,
    recognized_field_keys: frozenset[str],
    existing_field_keys: frozenset[str],
) -> list[ExtractedField]:
    blocked = {_normalize_catalog_key(key) for key in recognized_field_keys}
    blocked.update(_normalize_catalog_key(key) for key in existing_field_keys)
    filtered: list[ExtractedField] = []
    seen: set[str] = set()
    for row in suggestions:
        semantic = _normalize_catalog_key(row.key)
        if not semantic or semantic in blocked or semantic in seen:
            continue
        seen.add(semantic)
        filtered.append(row)
    return filtered


def layout_kv_field_suggestions(
    blocks: list[ExtractionBlock],
    representation: DocumentRepresentation | None,
    *,
    model: LayoutKvRoleHeadModel | None = None,
    recognized_field_keys: frozenset[str] | None = None,
    existing_field_keys: frozenset[str] | None = None,
) -> list[ExtractedField]:
    """Predict key/value pairs and emit field suggestions (empty when model unavailable)."""
    resolved_model = model if model is not None else get_layout_kv_role_head()
    entities = _entities_from_representation(blocks, representation)
    if len(entities) < _MIN_LAYOUT_ENTITIES:
        return []

    roles: list[tuple[LayoutEntity, str, float]] = []
    for entity in entities:
        label, confidence = predict_role(
            resolved_model,
            entity_feature_vector(entity, entities),
        )
        roles.append((entity, label, confidence))

    keys = [
        entity
        for entity, label, confidence in roles
        if label == "key" and confidence >= resolved_model.role_min_confidence
    ]
    values = [
        entity
        for entity, label, confidence in roles
        if label == "value" and confidence >= resolved_model.role_min_confidence
    ]
    if not keys or not values:
        return []

    suggestions: list[ExtractedField] = []
    used_values: set[int] = set()
    for key_entity in keys:
        best_value: LayoutEntity | None = None
        best_score = -1.0
        for value_entity in values:
            if value_entity.index in used_values:
                continue
            if value_entity.page != key_entity.page:
                continue
            link_features = link_feature_vector(key_entity, value_entity)
            score = predict_link_probability(resolved_model, link_features)
            if score > best_score:
                best_score = score
                best_value = value_entity
        if best_value is None or best_score < resolved_model.link_min_confidence:
            continue
        used_values.add(best_value.index)
        key_label = slug_field_key(key_entity.text)
        value_text = best_value.text.strip()
        if not key_label or not value_text:
            continue
        pair_confidence = min(best_score, 0.99)
        suggestions.append(
            ExtractedField(key=key_label, value=value_text, confidence=float(pair_confidence))
        )

    catalog = recognized_field_keys if recognized_field_keys is not None else frozenset()
    existing = existing_field_keys if existing_field_keys is not None else frozenset()
    return _filter_existing_keys(
        suggestions,
        recognized_field_keys=catalog,
        existing_field_keys=existing,
    )
