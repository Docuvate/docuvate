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
    lower = base.lower()
    if lower == "absender":
        variants.append("Kurzer Absender")
    if lower in ("betrag", "amount"):
        variants.extend(["Bruttobetrag", "Nettobetrag", "Summe", "Gesamtbetrag"])
    return tuple(dict.fromkeys(variants))


_DATE_TOKEN = re.compile(r"\b(\d{2}[./-]\d{2}[./-]\d{2,4})\b")
_AMOUNT_ON_LABEL_LINE = re.compile(
    r"(?i)(?:betrag|bruttobetrag|nettobetrag|summe|total|amount|gesamtbetrag)\s*[:\-–—]\s*"
    r"(?:EUR|€\s*)?([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2}|[0-9]+[.,][0-9]{2})\s*(?:EUR|€)?"
)
_CURRENCY_VALUE = re.compile(
    r"^(?:(?:EUR|€)\s*)?([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2}|[0-9]+[.,][0-9]{2})\s*(?:EUR|€)?$",
    re.IGNORECASE,
)
_DATE_FRAGMENT = re.compile(r"^\d{1,2}[./]\d{1,2}$")


def _parse_date_field_value(raw: str) -> str | None:
    match = _DATE_TOKEN.search(raw.strip())
    return match.group(1) if match else None


def _parse_currency_field_value(raw: str) -> str | None:
    stripped = raw.strip()
    if not stripped or _DATE_FRAGMENT.match(stripped):
        return None
    match = _CURRENCY_VALUE.match(stripped)
    if not match:
        return None
    amount = match.group(1)
    if _DATE_FRAGMENT.match(amount):
        return None
    if re.match(r"^\d{2}[./-]\d{2}[./-]\d{2,4}$", amount):
        return None
    has_currency_hint = bool(re.search(r"(?i)EUR|€", stripped))
    if re.match(r"^[0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2}$", amount):
        return amount
    if re.match(r"^[0-9]+,[0-9]{2}$", amount) and has_currency_hint:
        return amount
    if re.match(r"^[0-9]+[.,][0-9]{2}$", amount) and has_currency_hint:
        return amount
    return None


def _is_single_line_field_type(field_type: str) -> bool:
    return field_type.strip().lower() in ("date", "currency", "number")


def _extract_near_label(
    text: str,
    label: str,
    stop_labels: tuple[str, ...],
    *,
    field_type: str,
) -> str | None:
    if not label.strip():
        return None
    allow_continuation = not _is_single_line_field_type(field_type)
    value: str | None = None
    for variant in _label_search_variants(label):
        value = extract_multiline_value_after_label(
            text,
            variant,
            stop_labels=stop_labels,
            max_lines=8,
            max_chars=480,
            allow_continuation=allow_continuation,
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
    near = _extract_near_label(text, label, stop_labels, field_type=field_type)
    if near:
        if field_type == "date":
            parsed = _parse_date_field_value(near)
            if parsed:
                return parsed, 0.78
        elif field_type in ("currency", "number"):
            parsed = _parse_currency_field_value(near)
            if parsed:
                return parsed, 0.78
        else:
            return near, 0.78

    if field_type == "date":
        date = re.search(r"\b(\d{2}[./-]\d{2}[./-]\d{2,4})\b", text)
        if date:
            return date.group(1), 0.55
    if field_type in ("currency", "number"):
        labeled = _AMOUNT_ON_LABEL_LINE.search(text)
        if labeled:
            parsed = _parse_currency_field_value(labeled.group(1))
            if parsed:
                return parsed, 0.6

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
