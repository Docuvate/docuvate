# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from docuvate_worker.domain.exact_fact_index.match_score import (
    DEFAULT_MATCH_SCORE_THRESHOLD,
    fellegi_sunter_match_score,
    match_score_tokens,
)


def test_decoy_partial_token_scores_below_default_gate() -> None:
    tokens = match_score_tokens(("gewinn", "2025"), None)
    score = fellegi_sunter_match_score(tokens, "reingewinn 2025", "12.345,67 EUR")
    assert score < DEFAULT_MATCH_SCORE_THRESHOLD


def test_answerable_predicate_scores_above_default_gate() -> None:
    tokens = match_score_tokens(("reingewinn", "2025"), 2025)
    score = fellegi_sunter_match_score(tokens, "reingewinn 2025", "12.345,67 EUR")
    assert score >= DEFAULT_MATCH_SCORE_THRESHOLD
