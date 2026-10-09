# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import re

from docuvate_worker.domain.models import ExtractedField

_EUR_SUFFIX_AMOUNT = re.compile(
    r"Betrag\s*:\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2}|[0-9]+,[0-9]{2})\s*(?:EUR|€)",
    re.IGNORECASE,
)
_EUR_PREFIX_AMOUNT = re.compile(
    r"(?:EUR|€)\s*([0-9]{1,3}(?:[.\s][0-9]{3})*,[0-9]{2}|[0-9]+[.,][0-9]{2})",
    re.IGNORECASE,
)
_COMPANY_LINE = re.compile(
    r"\b(GmbH|AG|UG|e\.?\s?K\.?|KG|OHG|SE|Inc\.|Ltd\.?)\b",
    re.IGNORECASE,
)
_INVOICE_HEADER = re.compile(r"^(Rechnung|Invoice)\b", re.IGNORECASE)


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


def _extract_vendor(text: str) -> str | None:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    for line in lines:
        if _COMPANY_LINE.search(line):
            return line[:120]
    for line in lines:
        if _INVOICE_HEADER.match(line):
            continue
        return line[:120]
    return lines[0][:120] if lines else None


def heuristic_fields(text: str) -> list[ExtractedField]:
    fields: list[ExtractedField] = []

    amount = _extract_amount(text)
    if amount:
        fields.append(ExtractedField(key="amount", value=amount))

    date = re.search(r"\b(\d{2}[./-]\d{2}[./-]\d{2,4})\b", text)
    if date:
        fields.append(ExtractedField(key="date", value=date.group(1)))

    vendor = _extract_vendor(text)
    if vendor:
        fields.append(ExtractedField(key="vendor", value=vendor))

    return fields
