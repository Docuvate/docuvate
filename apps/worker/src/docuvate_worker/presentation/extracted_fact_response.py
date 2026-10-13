# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from docuvate_worker.domain.exact_fact_index.types import ExtractedFact
from docuvate_worker.presentation.schemas import ExtractedFactModel, FactProvenanceModel


def extracted_facts_to_response(
    facts: tuple[ExtractedFact, ...] | None,
) -> list[ExtractedFactModel] | None:
    if facts is None:
        return None
    return [
        ExtractedFactModel(
            kind=fact.kind,
            predicate_key=fact.predicate_key,
            confidence=fact.confidence,
            provenance=FactProvenanceModel(
                page=fact.provenance.page,
                x=fact.provenance.x,
                y=fact.provenance.y,
                width=fact.provenance.width,
                height=fact.provenance.height,
                char_start=fact.provenance.char_start,
                char_end=fact.provenance.char_end,
            ),
            value_text=fact.value_text,
            amount_numeric=fact.amount_numeric,
            currency_code=fact.currency_code,
            value_date_iso=fact.value_date_iso,
            table_index=fact.table_index,
            row_index=fact.row_index,
            col_index=fact.col_index,
        )
        for fact in facts
    ]
