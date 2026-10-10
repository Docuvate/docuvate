# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import re

from docuvate_worker.domain.models import ExtractedField
from docuvate_worker.infrastructure.extractors.field_value_normalize import (
    strip_leading_sender_label_prefixes,
)

_EUR_SUFFIX_AMOUNT = re.compile(
    r"Betrag\s*:\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2}|[0-9]+,[0-9]{2})\s*(?:EUR|€)",
    re.IGNORECASE,
)
_EUR_PREFIX_AMOUNT = re.compile(
    r"(?:EUR|€)\s*([0-9]{1,3}(?:[.\s][0-9]{3})*,[0-9]{2}|[0-9]+[.,][0-9]{2})",
    re.IGNORECASE,
)
_COMPANY_LINE = re.compile(
    r"\b(GmbH|AG|UG|e\.?\s?K\.?|KG|OHG|SE|Inc\.|Ltd\.?|GmbH\s*&\s*Co\.?)\b",
    re.IGNORECASE,
)
_INVOICE_HEADER = re.compile(r"^(Rechnung|Invoice)\b", re.IGNORECASE)
_GERMAN_POSTAL = re.compile(r"\b\d{5}\s+[A-Za-zÄÖÜäöüß]")
_STREET_HINT = re.compile(
    r"\b(?:straße|str\.|strasse|weg|platz|allee|gasse|ring|damm)\b",
    re.IGNORECASE,
)
_EXPLICIT_SENDER_LABEL = re.compile(
    r"^(?:(?:kurzer\s+)?absender|vendor|sender|lieferant|from|von)\s*:",
    re.IGNORECASE,
)


def _normalize_amount(raw: str) -> str:
    cleaned = raw.strip()
    if "," in cleaned and "." in cleaned:
        cleaned = cleaned.replace(".", "").replace(",", ".")
    elif "," in cleaned:
        cleaned = cleaned.replace(",", ".")
    return cleaned


def _extract_amount(text: str) -> str | None:
    for pattern in (_EUR_SUFFIX_AMOUNT, _EUR_PREFIX_AMOUNT):
        match = pattern.search(text)
        if match:
            return _normalize_amount(match.group(1))
    return None


def _is_heading_like_vendor(line: str) -> bool:
    letters = [c for c in line if c.isalpha()]
    if len(letters) >= 12:
        upper_ratio = sum(1 for c in letters if c.isupper()) / len(letters)
        if upper_ratio > 0.82 and not _COMPANY_LINE.search(line):
            return True
    words = line.split()
    if len(words) >= 6 and not _COMPANY_LINE.search(line):
        title_case = sum(1 for w in words if w[:1].isupper() and len(w) > 2)
        if title_case >= max(4, len(words) - 2):
            return True
    return False


def _has_sender_evidence(
    lines: list[str],
    index: int,
    cleaned: str,
    *,
    had_explicit_label: bool,
) -> bool:
    if had_explicit_label:
        return True
    if _COMPANY_LINE.search(cleaned):
        return True
    if _GERMAN_POSTAL.search(cleaned) or _STREET_HINT.search(cleaned):
        return True
    window = lines[index : min(index + 4, len(lines))]
    block = " ".join(window)
    has_address = bool(_GERMAN_POSTAL.search(block) or _STREET_HINT.search(block))
    if has_address and (_COMPANY_LINE.search(cleaned) or len(cleaned) <= 64):
        return True
    return False


def _extract_vendor(text: str) -> str | None:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    company_hits: list[str] = []
    label_stripped_hits: list[str] = []
    for index, line in enumerate(lines):
        cleaned = strip_leading_sender_label_prefixes(line)
        had_label = cleaned != line or bool(_EXPLICIT_SENDER_LABEL.match(line))
        if not cleaned or _is_heading_like_vendor(cleaned):
            continue
        if _INVOICE_HEADER.match(cleaned):
            continue
        if not _has_sender_evidence(lines, index, cleaned, had_explicit_label=had_label):
            continue
        if _COMPANY_LINE.search(cleaned):
            company_hits.append(cleaned[:120])
        elif had_label:
            label_stripped_hits.append(cleaned[:120])
    if company_hits:
        return company_hits[0]
    return label_stripped_hits[0] if label_stripped_hits else None


def heuristic_field_suggestions(text: str) -> list[ExtractedField]:
    """Regex-based global field hints; not persisted as recognized until catalog + accept."""
    fields: list[ExtractedField] = []

    amount = _extract_amount(text)
    if amount:
        fields.append(ExtractedField(key="amount", value=amount, confidence=0.45))

    date = re.search(r"\b(\d{2}[./-]\d{2}[./-]\d{2,4})\b", text)
    if date:
        fields.append(ExtractedField(key="date", value=date.group(1), confidence=0.45))

    vendor = _extract_vendor(text)
    if vendor:
        fields.append(ExtractedField(key="vendor", value=vendor, confidence=0.45))

    return fields


def heuristic_fields(text: str) -> list[ExtractedField]:
    """Backward-compatible alias; heuristics are suggestions only."""
    return heuristic_field_suggestions(text)
