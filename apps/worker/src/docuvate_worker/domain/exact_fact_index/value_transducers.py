# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Deterministic value typing (amounts, dates) without document-specific rules."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date

_AMOUNT_WITH_CURRENCY = re.compile(
    r"^\s*("
    r"(?:EUR|€)\s*([0-9]{1,3}(?:[.\s][0-9]{3})*,[0-9]{2}|[0-9]+[.,][0-9]{2})"
    r"|"
    r"([0-9]{1,3}(?:[.\s][0-9]{3})*,[0-9]{2}|[0-9]+[.,][0-9]{2})\s*(?:EUR|€)"
    r")\s*$",
    re.IGNORECASE,
)
_PLAIN_AMOUNT = re.compile(
    r"^\s*([0-9]{1,3}(?:[.\s][0-9]{3})*,[0-9]{2}|[0-9]+[.,][0-9]{2})\s*$",
)
_DATE_DMY = re.compile(
    r"^\s*(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\s*$",
)
_TWO_DIGIT_YEAR_PIVOT = 99


def normalize_predicate_key(raw: str) -> str:
    collapsed = " ".join(raw.strip().split())
    return collapsed.casefold()


def _parse_amount_number(raw: str) -> float | None:
    cleaned = raw.strip().replace("\u00a0", " ")
    cleaned = cleaned.replace(" ", "")
    if "," in cleaned and "." in cleaned:
        cleaned = cleaned.replace(".", "").replace(",", ".")
    elif "," in cleaned:
        cleaned = cleaned.replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return None


@dataclass(frozen=True)
class ParsedAmount:
    amount: float
    currency_code: str | None


def parse_amount(value: str) -> ParsedAmount | None:
    match = _AMOUNT_WITH_CURRENCY.match(value)
    if match:
        number_raw = match.group(2) or match.group(3)
        if number_raw is None:
            return None
        amount = _parse_amount_number(number_raw)
        if amount is None:
            return None
        return ParsedAmount(amount=amount, currency_code="EUR")
    plain = _PLAIN_AMOUNT.match(value)
    if plain:
        amount = _parse_amount_number(plain.group(1))
        if amount is None:
            return None
        return ParsedAmount(amount=amount, currency_code=None)
    return None


def parse_iso_date(value: str) -> str | None:
    match = _DATE_DMY.match(value.strip())
    if not match:
        return None
    day = int(match.group(1))
    month = int(match.group(2))
    year_raw = int(match.group(3))
    year = year_raw if year_raw > _TWO_DIGIT_YEAR_PIVOT else 2000 + year_raw
    try:
        parsed = date(year, month, day)
    except ValueError:
        return None
    return parsed.isoformat()


def classify_typed_value(raw: str) -> tuple[str, ParsedAmount | None, str | None]:
    """Returns (kind_hint, amount, iso_date) where kind_hint is text|amount|date."""
    amount = parse_amount(raw)
    if amount is not None:
        return ("amount", amount, None)
    iso = parse_iso_date(raw)
    if iso is not None:
        return ("date", None, iso)
    return ("text", None, None)
