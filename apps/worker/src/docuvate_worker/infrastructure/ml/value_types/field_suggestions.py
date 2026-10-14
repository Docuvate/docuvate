# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from docuvate_worker.domain.models import ExtractedField
from docuvate_worker.infrastructure.extractors.field_value_normalize import (
    strip_leading_sender_label_prefixes,
)
from docuvate_worker.infrastructure.ml.value_types.model import ValueTypeModelBundle
from docuvate_worker.infrastructure.ml.value_types.registry import get_value_type_models


def _normalize_amount(raw: str) -> str:
    cleaned = raw.strip()
    if "," in cleaned and "." in cleaned:
        cleaned = cleaned.replace(".", "").replace(",", ".")
    elif "," in cleaned:
        cleaned = cleaned.replace(",", ".")
    return cleaned


def _digits_ratio(text: str) -> float:
    if not text:
        return 0.0
    digits = sum(1 for c in text if c.isdigit())
    return digits / len(text)


def _upper_ratio(text: str) -> float:
    letters = [c for c in text if c.isalpha()]
    if not letters:
        return 0.0
    return sum(1 for c in letters if c.isupper()) / len(letters)


def _is_heading_like(line: str, bundle: ValueTypeModelBundle) -> bool:
    org_score = bundle.log_likelihood(line, "organization")
    free_score = bundle.log_likelihood(line, "free_text")
    id_score = bundle.log_likelihood(line, "identifier")
    words = line.split()
    lowered = line.lower()
    has_company_hint = "gmbh" in lowered or " ltd" in lowered or " inc" in lowered
    if has_company_hint and org_score > max(free_score, id_score):
        return False
    if len(words) >= 6:  # noqa: PLR2004
        title_case = sum(1 for w in words if len(w) > 2 and w[0].isupper())  # noqa: PLR2004
        if title_case >= max(4, len(words) - 2) and not has_company_hint:
            return True
    if len(words) >= 6 and _upper_ratio(line) > 0.55 and not has_company_hint:  # noqa: PLR2004
        return True
    letters = [c for c in line if c.isalpha()]
    return (
        len(letters) >= 12  # noqa: PLR2004
        and _upper_ratio(line) > 0.82  # noqa: PLR2004
        and not has_company_hint
    )


def _is_invoice_banner(line: str) -> bool:
    first = line.strip().split(maxsplit=1)[0].lower() if line.strip() else ""
    return first in ("rechnung", "invoice")


def _split_label_value(line: str) -> tuple[str, str | None]:
    if ":" not in line:
        return line, None
    head, tail = line.split(":", 1)
    if not head.strip() or not tail.strip():
        return line, None
    return head, tail.strip()


def _separator_count(text: str) -> int:
    return sum(1 for ch in text if ch in "./-")


def _tokenize_value_candidates(line: str) -> list[str]:
    tokens: list[str] = []
    buf: list[str] = []
    for ch in line:
        if (
            ch.isalnum()
            or ch in "./-"
            or (ch == "," and buf and any(c.isdigit() for c in buf))
        ):
            buf.append(ch)
        elif buf:
            tokens.append("".join(buf))
            buf = []
    if buf:
        tokens.append("".join(buf))
    return tokens


def _iter_date_candidates(text: str) -> list[str]:
    candidates: list[str] = []
    for line in text.splitlines():
        for token in _tokenize_value_candidates(line):
            if len(token) < 8 or _separator_count(token) < 2:  # noqa: PLR2004
                continue
            if _digits_ratio(token) < 0.3:  # noqa: PLR2004
                continue
            candidates.append(token)
    return candidates


def _money_beats_date(token: str, money_score: float, date_score: float) -> bool:
    lowered = token.lower()
    if "eur" in lowered or "€" in token:
        return money_score > date_score - 10
    if "," in token:
        tail = token.rsplit(",", 1)[-1]
        if len(tail) == 2 and tail.isdigit():  # noqa: PLR2004
            return money_score > date_score - 8
    return money_score > date_score


def _pick_best_money(text: str, bundle: ValueTypeModelBundle) -> tuple[str, float] | None:
    best: tuple[str, float] | None = None
    candidates: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        _, value_part = _split_label_value(stripped)
        if value_part:
            candidates.append(value_part)
            candidates.extend(_tokenize_value_candidates(value_part))
        candidates.extend(_tokenize_value_candidates(stripped))
    for token in candidates:
        lowered = token.lower()
        if "x" in lowered:
            continue
        if len(token) < 3 or _digits_ratio(token) < 0.15:  # noqa: PLR2004
            continue
        money_score = bundle.log_likelihood(token, "money")
        date_score = bundle.log_likelihood(token, "date")
        if not _money_beats_date(token, money_score, date_score):
            continue
        if best is None or money_score > best[1]:
            best = (token, money_score)
    return best


def _header_date_boost(line_index: int, line: str, title_line: str) -> float:
    boost = 0.0
    if line_index <= 2:
        boost += 12.0
    elif line_index <= 5:
        boost += 6.0
    title_tokens = {part.lower() for part in title_line.split() if len(part) > 2}
    if title_tokens:
        overlap = sum(1 for part in line.split() if part.lower() in title_tokens)
        boost += min(8.0, overlap * 2.5)
    return boost


def _pick_best_date(text: str, bundle: ValueTypeModelBundle) -> tuple[str, float] | None:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    title_line = lines[0] if lines else ""
    best: tuple[str, float, int] | None = None
    for line_index, line in enumerate(lines):
        for token in _tokenize_value_candidates(line):
            if len(token) < 8 or _separator_count(token) < 2:  # noqa: PLR2004
                continue
            if _digits_ratio(token) < 0.3:  # noqa: PLR2004
                continue
            date_score = bundle.log_likelihood(token, "date") + _header_date_boost(
                line_index, line, title_line
            )
            money_score = bundle.log_likelihood(token, "money")
            if date_score <= money_score:
                continue
            length = len(token)
            if best is None or date_score > best[1] or (date_score == best[1] and length > best[2]):
                best = (token, date_score, length)
    if best is None:
        return None
    raw_score = best[1]
    confidence = min(0.95, max(0.45, 0.45 + raw_score * 0.02))
    if raw_score >= 55:  # noqa: PLR2004
        confidence = max(confidence, 0.92)
    return best[0], confidence


def _has_sender_evidence(
    lines: list[str],
    index: int,
    cleaned: str,
    bundle: ValueTypeModelBundle,
    *,
    had_explicit_label: bool,
) -> bool:
    if had_explicit_label:
        return True
    org_score = bundle.log_likelihood(cleaned, "organization")
    free_score = bundle.log_likelihood(cleaned, "free_text")
    addr_score = bundle.log_likelihood(cleaned, "address")
    id_score = bundle.log_likelihood(cleaned, "identifier")
    if org_score - free_score < 35:  # noqa: PLR2004
        return False
    if org_score >= max(addr_score, id_score):
        return True
    window = lines[index : min(index + 4, len(lines))]
    block = " ".join(window)
    block_addr = bundle.log_likelihood(block, "address")
    return block_addr > bundle.log_likelihood(block, "free_text") and len(cleaned) <= 64  # noqa: PLR2004


def _extract_vendor(text: str, bundle: ValueTypeModelBundle) -> str | None:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    company_hits: list[str] = []
    label_stripped_hits: list[str] = []
    for index, line in enumerate(lines):
        cleaned = strip_leading_sender_label_prefixes(line)
        had_label = cleaned != line
        _, value_part = _split_label_value(cleaned)
        candidate = value_part if value_part is not None else cleaned
        if not candidate or _is_heading_like(candidate, bundle):
            continue
        if not had_label and len(candidate.split()) >= 9:  # noqa: PLR2004
            continue
        if _is_invoice_banner(candidate):
            continue
        money_score = bundle.log_likelihood(candidate, "money")
        org_score = bundle.log_likelihood(candidate, "organization")
        if money_score >= org_score:
            continue
        if not _has_sender_evidence(
            lines, index, candidate, bundle, had_explicit_label=had_label
        ):
            continue
        free_score = bundle.log_likelihood(candidate, "free_text")
        if org_score <= free_score:
            continue
        if org_score - free_score > 0.5 or had_label:  # noqa: PLR2004
            if had_label:
                label_stripped_hits.append(candidate[:120])
            else:
                company_hits.append(candidate[:120])
    if company_hits:
        return company_hits[0]
    return label_stripped_hits[0] if label_stripped_hits else None


def learned_field_suggestions(
    text: str,
    bundle: ValueTypeModelBundle | None = None,
) -> list[ExtractedField]:
    models = bundle if bundle is not None else get_value_type_models()
    fields: list[ExtractedField] = []

    money = _pick_best_money(text, models)
    if money is not None:
        amount_raw, score = money
        fields.append(
            ExtractedField(
                key="amount",
                value=_normalize_amount(amount_raw),
                confidence=min(0.95, max(0.45, 0.45 + score * 0.02)),
            )
        )

    date = _pick_best_date(text, models)
    if date is not None:
        date_raw, confidence = date
        fields.append(
            ExtractedField(
                key="date",
                value=date_raw,
                confidence=confidence,
            )
        )

    vendor = _extract_vendor(text, models)
    if vendor:
        fields.append(ExtractedField(key="vendor", value=vendor, confidence=0.45))

    return fields
