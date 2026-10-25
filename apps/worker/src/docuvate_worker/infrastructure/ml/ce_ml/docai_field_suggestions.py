# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from docuvate_worker.domain.models import ExtractedField, ExtractionBlock
from docuvate_worker.infrastructure.ml.ce_ml.calibration import field_abstain_threshold
from docuvate_worker.infrastructure.ml.ce_ml.constants import MIN_LAYOUT_UNITS, MIN_LINK_SCORE_FLOOR
from docuvate_worker.infrastructure.ml.ce_ml.field_discovery import _slug
from docuvate_worker.infrastructure.ml.ce_ml.kv_items import extract_kv_items_from_blocks


def docai_kv_field_suggestions(
    blocks: list[ExtractionBlock],
    *,
    recognized_field_keys: frozenset[str] | None = None,
    existing_field_keys: frozenset[str] | None = None,
) -> list[ExtractedField]:
    if len(blocks) < MIN_LAYOUT_UNITS:
        return []
    items = extract_kv_items_from_blocks("pipeline", blocks)
    if not items:
        return []
    abstain = field_abstain_threshold()
    catalog = recognized_field_keys if recognized_field_keys is not None else frozenset()
    existing = existing_field_keys if existing_field_keys is not None else frozenset()
    suggestions: list[ExtractedField] = []
    for item in items:
        if not item.key_text or not item.value_text.strip():
            continue
        slug = _slug(item.key_text)
        storage_key = f"suggestion:{slug}"
        normalized = slug.replace("_", "")
        if normalized in {key.replace("_", "") for key in catalog}:
            continue
        if storage_key in existing or slug in existing:
            continue
        confidence = float(min(1.0, max(item.link_score, MIN_LINK_SCORE_FLOOR)))
        if confidence < abstain:
            continue
        suggestions.append(
            ExtractedField(
                key=storage_key,
                value=item.value_text.strip(),
                confidence=confidence,
            )
        )
    return suggestions
