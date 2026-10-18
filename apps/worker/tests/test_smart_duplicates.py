# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from docuvate_worker.domain.smart_duplicates import (
    SmartDuplicateConfig,
    SmartDuplicateDocument,
    score_smart_duplicate_candidates,
)

_TEMPLATE = [
    'NORDWIND ENERGIE GMBH',
    'Musterstrasse 12 80331 Muenchen',
    'Rechnung Nr. 2024-1001',
    'Datum: 15.03.2024',
    'Position Beschreibung Betrag',
    '1 Beratungsleistung',
]


def _doc(doc_id: str, amount_line: str) -> SmartDuplicateDocument:
    return SmartDuplicateDocument(document_id=doc_id, lines=[*_TEMPLATE, amount_line])


def test_same_store_different_amount_not_duplicate() -> None:
    focus = _doc('a', 'Gesamtbetrag EUR 199.00')
    peer = _doc('b', 'Gesamtbetrag EUR 512.00')
    hits = score_smart_duplicate_candidates(
        focus,
        [peer],
        config=SmartDuplicateConfig(threshold=0.55),
    )
    assert hits == []


def test_rescan_same_store_and_amount_is_duplicate() -> None:
    focus = _doc('a', 'Gesamtbetrag EUR 199.00')
    peer = _doc('b', 'Gesamtbetrag EUR 199.00')
    hits = score_smart_duplicate_candidates(
        focus,
        [peer],
        config=SmartDuplicateConfig(threshold=0.55),
    )
    assert len(hits) == 1
    assert hits[0].document_id == 'b'
    assert hits[0].similarity >= 0.55


def test_template_only_shared_across_unrelated_docs_stays_below_threshold() -> None:
    shared = [
        'GEMEINDE BEISPIELSTADT',
        'Hundesteuer Bescheid 2024',
        'Steuernummer 12/345/67890',
    ]
    focus = SmartDuplicateDocument(
        document_id='a',
        lines=[*shared, 'Hund Name Bello', 'Jahresgebuehr EUR 120.00'],
    )
    peer = SmartDuplicateDocument(
        document_id='b',
        lines=[*shared, 'Hund Name Luna', 'Jahresgebuehr EUR 85.00'],
    )
    hits = score_smart_duplicate_candidates(focus, [peer])
    assert hits == []
