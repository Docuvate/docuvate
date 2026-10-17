# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass

from docuvate_worker.infrastructure.ml.value_types.amount_label_e5 import amount_lines_e5_cosine
from docuvate_worker.infrastructure.ml.value_types.amount_line_ranker import (
    AmountLineFeatures,
    build_amount_line_features,
)
from docuvate_worker.infrastructure.ml.value_types.amount_money_parse import (
    parse_money_amount,
    vat_sum_consistency_hint,
)
from docuvate_worker.infrastructure.ml.value_types.model import ValueTypeModelBundle


def _digits_ratio(text: str) -> float:
    if not text:
        return 0.0
    digits = sum(1 for c in text if c.isdigit())
    return digits / len(text)


def _split_label_value(line: str) -> tuple[str, str | None]:
    if ":" not in line:
        return line, None
    head, tail = line.split(":", 1)
    if not head.strip() or not tail.strip():
        return line, None
    return head, tail.strip()


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
class AmountCandidateRow:
    token: str
    line_index: int
    features: AmountLineFeatures


def iter_amount_candidate_rows(
    text: str, bundle: ValueTypeModelBundle
) -> list[AmountCandidateRow]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    line_e5 = amount_lines_e5_cosine(lines)
    peer_values: list[float] = []
    raw_rows: list[tuple[str, int, bool, float, float, float, float, float]] = []
    seen: set[tuple[str, int]] = set()
    for line_index, stripped in enumerate(lines):
        _, value_part = _split_label_value(stripped)
        had_label = value_part is not None
        token_sources: list[str] = []
        if value_part:
            token_sources.append(value_part)
            token_sources.extend(_tokenize_value_candidates(value_part))
        token_sources.extend(_tokenize_value_candidates(stripped))
        for token in token_sources:
            key = (token, line_index)
            if key in seen:
                continue
            seen.add(key)
            lowered = token.lower()
            if "x" in lowered:
                continue
            if len(token) < 3 or _digits_ratio(token) < 0.15:  # noqa: PLR2004
                continue
            money_score = bundle.log_likelihood(token, "money")
            date_score = bundle.log_likelihood(token, "date")
            if not _money_beats_date(token, money_score, date_score):
                continue
            parsed = parse_money_amount(token)
            if parsed is not None:
                peer_values.append(parsed)
            id_score = bundle.log_likelihood(token, "identifier")
            free_score = bundle.log_likelihood(token, "free_text")
            addr_score = bundle.log_likelihood(token, "address")
            alt = max(id_score, date_score, free_score, addr_score)
            raw_rows.append(
                (
                    token,
                    line_index,
                    had_label,
                    money_score,
                    date_score,
                    money_score - alt,
                    line_e5[line_index],
                    parsed if parsed is not None else -1.0,
                )
            )
    parsed_peers = [value for value in peer_values if value > 0]
    rows: list[AmountCandidateRow] = []
    for (
        token,
        line_index,
        had_label,
        money_score,
        date_score,
        money_margin,
        label_e5,
        parsed,
    ) in raw_rows:
        vat_hint = (
            vat_sum_consistency_hint(parsed, parsed_peers)
            if parsed > 0
            else 0.0
        )
        features = build_amount_line_features(
            bundle=bundle,
            token=token,
            line_index=line_index,
            line_count=len(lines),
            had_explicit_label=had_label,
            money_score=money_score,
            date_score=date_score,
            money_margin_over_non_money=money_margin,
            amount_label_e5_cosine=label_e5,
            vat_sum_consistency_hint=vat_hint,
        )
        rows.append(AmountCandidateRow(token=token, line_index=line_index, features=features))
    return rows
