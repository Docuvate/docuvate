# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass

from docuvate_worker.domain.models import ExtractedField
from docuvate_worker.infrastructure.ml.value_types.amount_candidate_rows import (
    iter_amount_candidate_rows,
)
from docuvate_worker.infrastructure.ml.value_types.amount_line_ranker import (
    get_amount_line_ranker,
)
from docuvate_worker.infrastructure.ml.value_types.field_confidence_calibration import (
    get_field_confidence_calibration,
)
from docuvate_worker.infrastructure.ml.value_types.model import ValueTypeModelBundle
from docuvate_worker.infrastructure.ml.value_types.registry import get_value_type_models
from docuvate_worker.infrastructure.ml.value_types.sender_line_e5 import sender_lines_e5_cosine
from docuvate_worker.infrastructure.ml.value_types.vendor_line_ranker import (
    build_line_features,
    get_vendor_line_ranker,
)
from docuvate_worker.infrastructure.ml.value_types.vendor_role_line_e5 import (
    doc_heading_lines_e5_cosine,
    recipient_lines_e5_cosine,
    supplier_lines_e5_cosine,
)

_HEADER_DATE_STRONG_TOP_LINE = 2
_HEADER_DATE_WEAK_TOP_LINE = 5
_MIN_HEADER_TITLE_TOKEN_LEN = 2


def _normalize_amount(raw: str) -> str:
    cleaned = raw.strip()
    for suffix in (" EUR", " eur", "€"):
        if cleaned.endswith(suffix):
            cleaned = cleaned[: -len(suffix)].strip()
            break
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


@dataclass(frozen=True)
class _AmountCandidate:
    token: str
    ranker_score: float
    amount_label_e5_cosine: float
    money_margin_over_non_money: float


def _rank_amount_candidates(text: str, bundle: ValueTypeModelBundle) -> list[_AmountCandidate]:
    ranker = get_amount_line_ranker()
    ranked = [
        _AmountCandidate(
            token=row.token,
            ranker_score=ranker.score(row.features),
            amount_label_e5_cosine=row.features.amount_label_e5_cosine,
            money_margin_over_non_money=row.features.money_margin_over_non_money,
        )
        for row in iter_amount_candidate_rows(text, bundle)
    ]
    ranked.sort(key=lambda row: row.ranker_score, reverse=True)
    return ranked


def _pick_best_amount(text: str, bundle: ValueTypeModelBundle) -> _AmountCandidate | None:
    ranked = _rank_amount_candidates(text, bundle)
    if not ranked:
        return None
    ranker = get_amount_line_ranker()
    best = ranked[0]
    if best.ranker_score < ranker.min_score:
        return None
    return best


def _header_date_boost(line_index: int, line: str, title_line: str) -> float:
    boost = 0.0
    if line_index <= _HEADER_DATE_STRONG_TOP_LINE:
        boost += 12.0
    elif line_index <= _HEADER_DATE_WEAK_TOP_LINE:
        boost += 6.0
    title_tokens = {
        part.lower()
        for part in title_line.split()
        if len(part) > _MIN_HEADER_TITLE_TOKEN_LEN
    }
    if title_tokens:
        overlap = sum(1 for part in line.split() if part.lower() in title_tokens)
        boost += min(8.0, overlap * 2.5)
    return boost


def _strong_title_header_period_date(
    text: str, bundle: ValueTypeModelBundle
) -> tuple[str, float] | None:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if len(lines) < 2:  # noqa: PLR2004
        return None
    if not _is_heading_like(lines[0], bundle):
        return None
    for line in lines[1:4]:
        for token in _tokenize_value_candidates(line):
            if len(token) < 8 or _separator_count(token) < 2:  # noqa: PLR2004
                continue
            date_score = bundle.log_likelihood(token, "date")
            money_score = bundle.log_likelihood(token, "money")
            if date_score <= money_score + 4:
                continue
            if date_score < 48:  # noqa: PLR2004
                continue
            cal = get_field_confidence_calibration()
            confidence = cal.date_confidence_from_log_score(date_score)
            return token, confidence
    return None


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
    cal = get_field_confidence_calibration()
    confidence = cal.date_confidence_from_log_score(raw_score)
    return best[0], confidence


def _has_sender_evidence(
    lines: list[str],
    index: int,
    cleaned: str,
    bundle: ValueTypeModelBundle,
    *,
    had_explicit_label: bool,
    sender_e5_cosine: float = 0.0,
) -> bool:
    if had_explicit_label:
        return True
    cal = get_field_confidence_calibration()
    if sender_e5_cosine >= cal.vendor_min_sender_e5_cosine:
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


@dataclass(frozen=True)
class _VendorCandidate:
    value: str
    had_explicit_label: bool
    sender_e5_cosine: float
    recipient_e5_cosine: float
    supplier_e5_cosine: float
    doc_heading_e5_cosine: float
    ranker_score: float
    line_index: int


def _extract_vendor(text: str, bundle: ValueTypeModelBundle) -> _VendorCandidate | None:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    sender_cosines = sender_lines_e5_cosine(lines)
    recipient_cosines = recipient_lines_e5_cosine(lines)
    supplier_cosines = supplier_lines_e5_cosine(lines)
    heading_cosines = doc_heading_lines_e5_cosine(lines)
    ranker = get_vendor_line_ranker()
    first_label_line_index: int | None = None
    for index, line in enumerate(lines):
        if _split_label_value(line)[1] is not None:
            first_label_line_index = index
            break
    candidates: list[_VendorCandidate] = []
    for index, line in enumerate(lines):
        _, value_part = _split_label_value(line)
        had_label = value_part is not None
        candidate = value_part if value_part is not None else line.strip()
        if not candidate or _is_heading_like(candidate, bundle):
            continue
        if not had_label and len(candidate.split()) >= 9:  # noqa: PLR2004
            continue
        if _is_invoice_banner(candidate):
            continue
        money_score = bundle.log_likelihood(candidate, "money")
        org_score = bundle.log_likelihood(candidate, "organization")
        if money_score >= org_score and not had_label:
            continue
        if not _has_sender_evidence(
            lines,
            index,
            candidate,
            bundle,
            had_explicit_label=had_label,
            sender_e5_cosine=sender_cosines[index],
        ):
            continue
        free_score = bundle.log_likelihood(candidate, "free_text")
        if org_score <= free_score:
            continue
        if org_score - free_score <= 0.5 and not had_label:  # noqa: PLR2004
            continue
        features = build_line_features(
            bundle=bundle,
            candidate=candidate,
            line_index=index,
            line_count=len(lines),
            sender_e5_cosine=sender_cosines[index],
            had_explicit_label=had_label,
            first_label_line_index=first_label_line_index,
            recipient_e5_cosine=recipient_cosines[index],
            supplier_e5_cosine=supplier_cosines[index],
            doc_heading_e5_cosine=heading_cosines[index],
        )
        ranker_score = ranker.score(features)
        candidates.append(
            _VendorCandidate(
                value=candidate[:120],
                had_explicit_label=had_label,
                sender_e5_cosine=sender_cosines[index],
                recipient_e5_cosine=recipient_cosines[index],
                supplier_e5_cosine=supplier_cosines[index],
                doc_heading_e5_cosine=heading_cosines[index],
                ranker_score=ranker_score,
                line_index=index,
            )
        )
    if not candidates:
        return None
    best_score = max(row.ranker_score for row in candidates)
    shortlist = [row for row in candidates if row.ranker_score >= best_score - 0.06]
    recipient_filtered = [
        row
        for row in shortlist
        if not (
            row.had_explicit_label
            and row.recipient_e5_cosine > row.supplier_e5_cosine
        )
    ]
    if recipient_filtered:
        shortlist = recipient_filtered
    best = max(
        shortlist,
        key=lambda row: (
            row.ranker_score,
            row.had_explicit_label,
            row.supplier_e5_cosine - row.doc_heading_e5_cosine,
            row.sender_e5_cosine - row.recipient_e5_cosine,
            -row.line_index,
        ),
    )
    cal = get_field_confidence_calibration()
    min_score = ranker.min_score_for(
        had_explicit_label=best.had_explicit_label,
        sender_e5_cosine=best.sender_e5_cosine,
        sender_e5_floor=cal.vendor_min_sender_e5_cosine,
    )
    if best.ranker_score + 1e-9 < min_score:
        return None
    return best


def peek_vendor_promotion_candidate(
    text: str, bundle: ValueTypeModelBundle | None = None
) -> _VendorCandidate | None:
    """Top vendor line after ranker selection (before ranker min-score and probability gates)."""
    models = bundle if bundle is not None else get_value_type_models()
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    sender_cosines = sender_lines_e5_cosine(lines)
    recipient_cosines = recipient_lines_e5_cosine(lines)
    supplier_cosines = supplier_lines_e5_cosine(lines)
    heading_cosines = doc_heading_lines_e5_cosine(lines)
    ranker = get_vendor_line_ranker()
    first_label_line_index: int | None = None
    for index, line in enumerate(lines):
        if _split_label_value(line)[1] is not None:
            first_label_line_index = index
            break
    candidates: list[_VendorCandidate] = []
    for index, line in enumerate(lines):
        _, value_part = _split_label_value(line)
        had_label = value_part is not None
        candidate = value_part if value_part is not None else line.strip()
        if not candidate or _is_heading_like(candidate, models):
            continue
        if not had_label and len(candidate.split()) >= 9:  # noqa: PLR2004
            continue
        if _is_invoice_banner(candidate):
            continue
        money_score = models.log_likelihood(candidate, "money")
        org_score = models.log_likelihood(candidate, "organization")
        if money_score >= org_score and not had_label:
            continue
        if not _has_sender_evidence(
            lines,
            index,
            candidate,
            models,
            had_explicit_label=had_label,
            sender_e5_cosine=sender_cosines[index],
        ):
            continue
        free_score = models.log_likelihood(candidate, "free_text")
        if org_score <= free_score:
            continue
        if org_score - free_score <= 0.5 and not had_label:  # noqa: PLR2004
            continue
        features = build_line_features(
            bundle=models,
            candidate=candidate,
            line_index=index,
            line_count=len(lines),
            sender_e5_cosine=sender_cosines[index],
            had_explicit_label=had_label,
            first_label_line_index=first_label_line_index,
            recipient_e5_cosine=recipient_cosines[index],
            supplier_e5_cosine=supplier_cosines[index],
            doc_heading_e5_cosine=heading_cosines[index],
        )
        ranker_score = ranker.score(features)
        candidates.append(
            _VendorCandidate(
                value=candidate[:120],
                had_explicit_label=had_label,
                sender_e5_cosine=sender_cosines[index],
                recipient_e5_cosine=recipient_cosines[index],
                supplier_e5_cosine=supplier_cosines[index],
                doc_heading_e5_cosine=heading_cosines[index],
                ranker_score=ranker_score,
                line_index=index,
            )
        )
    if not candidates:
        return None
    best_score = max(row.ranker_score for row in candidates)
    shortlist = [row for row in candidates if row.ranker_score >= best_score - 0.06]
    recipient_filtered = [
        row
        for row in shortlist
        if not (
            row.had_explicit_label
            and row.recipient_e5_cosine > row.supplier_e5_cosine
        )
    ]
    if recipient_filtered:
        shortlist = recipient_filtered
    return max(
        shortlist,
        key=lambda row: (
            row.ranker_score,
            row.had_explicit_label,
            row.supplier_e5_cosine - row.doc_heading_e5_cosine,
            row.sender_e5_cosine - row.recipient_e5_cosine,
            -row.line_index,
        ),
    )


def peek_amount_promotion_candidate(
    text: str, bundle: ValueTypeModelBundle | None = None
) -> _AmountCandidate | None:
    models = bundle if bundle is not None else get_value_type_models()
    ranked = _rank_amount_candidates(text, models)
    return ranked[0] if ranked else None


def learned_field_suggestions(
    text: str,
    bundle: ValueTypeModelBundle | None = None,
) -> list[ExtractedField]:
    models = bundle if bundle is not None else get_value_type_models()
    fields: list[ExtractedField] = []

    amount_row = _pick_best_amount(text, models)
    if amount_row is not None:
        ranked = _rank_amount_candidates(text, models)
        runner_up = ranked[1].ranker_score if len(ranked) > 1 else float("-inf")
        cal = get_field_confidence_calibration()
        ok, confidence = cal.amount_meets_auto_promote_gate(
            ranker_score=amount_row.ranker_score,
            runner_up_ranker_score=runner_up,
            amount_label_e5_cosine=amount_row.amount_label_e5_cosine,
            money_margin_over_non_money=amount_row.money_margin_over_non_money,
        )
        if ok:
            fields.append(
                ExtractedField(
                    key="amount",
                    value=_normalize_amount(amount_row.token),
                    confidence=confidence,
                )
            )

    date = _strong_title_header_period_date(text, models) or _pick_best_date(text, models)
    if date is not None:
        date_raw, confidence = date
        fields.append(
            ExtractedField(
                key="date",
                value=date_raw,
                confidence=confidence,
            )
        )

    vendor_row = _extract_vendor(text, models)
    if vendor_row is not None:
        vendor = vendor_row.value
        vendor_addr = models.log_likelihood(vendor, "address")
        vendor_id = models.log_likelihood(vendor, "identifier")
        vendor_org = models.log_likelihood(vendor, "organization")
        vendor_free = models.log_likelihood(vendor, "free_text")
        cal = get_field_confidence_calibration()
        ok, confidence = cal.vendor_meets_auto_promote_gate(
            org_score=vendor_org,
            free_score=vendor_free,
            addr_score=vendor_addr,
            id_score=vendor_id,
            had_explicit_label=vendor_row.had_explicit_label,
            sender_e5_cosine=vendor_row.sender_e5_cosine,
            ranker_score=vendor_row.ranker_score,
            recipient_e5_cosine=vendor_row.recipient_e5_cosine,
            supplier_e5_cosine=vendor_row.supplier_e5_cosine,
            doc_heading_e5_cosine=vendor_row.doc_heading_e5_cosine,
        )
        if ok:
            fields.append(ExtractedField(key="vendor", value=vendor, confidence=confidence))

    return fields
