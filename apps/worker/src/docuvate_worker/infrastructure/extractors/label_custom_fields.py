# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import re

from docuvate_worker.domain.models import ExtractedField
from docuvate_worker.infrastructure.extractors.field_value_multiline import (
    extract_multiline_value_after_label,
)
from docuvate_worker.infrastructure.extractors.field_value_normalize import (
    strip_leading_sender_label_prefixes,
)


def _escape_label(label: str) -> str:
    return re.escape(label.strip())


def _label_search_variants(label: str) -> tuple[str, ...]:
    base = label.strip()
    if not base:
        return ()
    variants = [base]
    if base.lower() == "absender":
        variants.append("Kurzer Absender")
    return tuple(dict.fromkeys(variants))


def _extract_near_label(text: str, label: str, stop_labels: tuple[str, ...]) -> str | None:
    if not label.strip():
        return None
    value: str | None = None
    for variant in _label_search_variants(label):
        value = extract_multiline_value_after_label(
            text,
            variant,
            stop_labels=stop_labels,
            max_lines=8,
            max_chars=480,
        )
        if value:
            break
    if value:
        value = strip_leading_sender_label_prefixes(value.strip(" ."))
        if value:
            return value[:480]
    return None


def _extract_by_type(
    text: str,
    field_type: str,
    label: str,
    stop_labels: tuple[str, ...],
) -> tuple[str | None, float]:
    field_type = field_type.strip().lower()
    near = _extract_near_label(text, label, stop_labels)
    if near:
        return near, 0.78

    if field_type == "date":
        date = re.search(r"\b(\d{2}[./-]\d{2}[./-]\d{2,4})\b", text)
        if date:
            return date.group(1), 0.55
    if field_type in ("currency", "number"):
        amount = re.search(r"(?:EUR|€)\s*([0-9]+[.,][0-9]{2})", text, re.IGNORECASE)
        if amount:
            return amount.group(1).replace(",", "."), 0.55
        plain = re.search(r"\b([0-9]+[.,][0-9]{2})\b", text)
        if plain:
            return plain.group(1).replace(",", "."), 0.45

    label_lower = label.lower()
    if any(h in label_lower for h in ("betrag", "summe", "amount", "total")):
        amount = re.search(r"(?:EUR|€)\s*([0-9]+[.,][0-9]{2})", text, re.IGNORECASE)
        if amount:
            return amount.group(1).replace(",", "."), 0.6

    return None, 0.0


def extract_label_custom_fields(
    text: str,
    *,
    tag_name: str,
    fields: list[dict[str, str]],
) -> list[ExtractedField]:
    normalized = text.strip()
    if not normalized or not fields:
        return []

    stop_labels = tuple(
        str(spec.get("label", spec.get("key", ""))).strip()
        for spec in fields
        if str(spec.get("key", "")).strip()
    )
    results: list[ExtractedField] = []
    for spec in fields:
        key = str(spec.get("key", "")).strip()
        label = str(spec.get("label", key)).strip()
        field_type = str(spec.get("field_type", "text"))
        if not key:
            continue
        value, confidence = _extract_by_type(normalized, field_type, label, stop_labels)
        if not value:
            continue
        normalized_value = strip_leading_sender_label_prefixes(value)
        if not normalized_value:
            continue
        results.append(
            ExtractedField(
                key=key, value=normalized_value, confidence=round(confidence, 3)
            )
        )
    return results
