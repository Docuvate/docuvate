# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Fellegi-Sunter predicate match score (mirrors @docuvate/contracts exact-fact-match)."""

from __future__ import annotations

import math
import re
from dataclasses import dataclass

from docuvate_worker.domain.math_stable import sigmoid

_YEAR_TOKEN = re.compile(r"^(19|20)\d{2}$")
_MIN_QUERY_TOKEN_LEN = 2


@dataclass(frozen=True, slots=True)
class FellegiSunterWeights:
    coverage_m: float
    coverage_u: float
    full_predicate_m: float
    full_predicate_u: float


DEFAULT_WEIGHTS = FellegiSunterWeights(
    coverage_m=1.0,
    coverage_u=1.0 / 6.0,
    full_predicate_m=9.0 / 11.0,
    full_predicate_u=0.0,
)

DEFAULT_MATCH_SCORE_THRESHOLD = 0.55


def normalize_match_text(raw: str) -> str:
    collapsed = " ".join(part for part in raw.strip().split() if part)
    return collapsed.casefold()


def match_score_tokens(predicate_tokens: tuple[str, ...], year_hint: int | None) -> tuple[str, ...]:
    year_text = str(year_hint) if year_hint is not None else None
    out: list[str] = []
    for token in predicate_tokens:
        if year_text is not None and token == year_text:
            continue
        if _YEAR_TOKEN.match(token):
            continue
        out.append(token)
    return tuple(out)


def _word_set(text: str) -> set[str]:
    return {part for part in normalize_match_text(text).split() if part}


def _token_matches(token: str, words: set[str]) -> bool:
    return len(token) >= _MIN_QUERY_TOKEN_LEN and token in words


def token_coverage(
    query_tokens: tuple[str, ...],
    predicate_key: str,
    value_text: str | None,
) -> float:
    if not query_tokens:
        return 1.0
    words = _word_set(f"{predicate_key} {value_text or ''}")
    matched = sum(1 for token in query_tokens if _token_matches(token, words))
    return matched / len(query_tokens)


def full_predicate_match(query_tokens: tuple[str, ...], predicate_key: str) -> bool:
    if not query_tokens:
        return True
    words = _word_set(predicate_key)
    return all(_token_matches(token, words) for token in query_tokens)


def _field_log_odds(agree: bool, m: float, u: float) -> float:
    m_clamped = min(max(m, 1e-6), 1.0 - 1e-6)
    u_clamped = min(max(u, 1e-6), 1.0 - 1e-6)
    if agree:
        return math.log(m_clamped / u_clamped)
    return math.log((1.0 - m_clamped) / (1.0 - u_clamped))


def fellegi_sunter_match_score(
    query_tokens: tuple[str, ...],
    predicate_key: str,
    value_text: str | None,
    weights: FellegiSunterWeights = DEFAULT_WEIGHTS,
) -> float:
    if not query_tokens:
        return 1.0
    coverage = token_coverage(query_tokens, predicate_key, value_text)
    agree_full = full_predicate_match(query_tokens, predicate_key)
    cov_match = _field_log_odds(True, weights.coverage_m, weights.coverage_u)
    cov_non = _field_log_odds(False, weights.coverage_m, weights.coverage_u)
    log_odds = coverage * cov_match + (1.0 - coverage) * cov_non
    log_odds += _field_log_odds(agree_full, weights.full_predicate_m, weights.full_predicate_u)
    return sigmoid(log_odds)
