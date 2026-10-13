# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Smoke gate: template-subtracted duplicate scoring on synthetic receipts."""

from __future__ import annotations

from docuvate_worker.domain.smart_duplicates import (
    SmartDuplicateConfig,
    SmartDuplicateDocument,
    score_smart_duplicate_candidates,
)

from bench.model_gates.schema import GateRunResult, MetricValue

GATE_ID = 'duplicates'

_TEMPLATE = [
    'NORDWIND ENERGIE GMBH',
    'Musterstrasse 12 80331 Muenchen',
    'Rechnung Nr. 2024-1001',
    'Datum: 15.03.2024',
    'Position Beschreibung Betrag',
    '1 Beratungsleistung',
]


def run_duplicates_gate() -> GateRunResult:
    focus = SmartDuplicateDocument(
        document_id='a',
        lines=[*_TEMPLATE, 'Gesamtbetrag EUR 199.00'],
    )
    peer_same = SmartDuplicateDocument(
        document_id='b',
        lines=[*_TEMPLATE, 'Gesamtbetrag EUR 199.00'],
    )
    peer_diff = SmartDuplicateDocument(
        document_id='c',
        lines=[*_TEMPLATE, 'Gesamtbetrag EUR 512.00'],
    )
    cfg = SmartDuplicateConfig(threshold=0.55)
    hit = score_smart_duplicate_candidates(focus, [peer_same], config=cfg)
    miss = score_smart_duplicate_candidates(focus, [peer_diff], config=cfg)
    recall = 1.0 if hit else 0.0
    precision = 1.0 if not miss else 0.0
    f1 = 2 * precision * recall / max(precision + recall, 1e-9)
    status = 'ok' if f1 >= 1.0 else 'fail'
    return GateRunResult(
        gate_id=GATE_ID,
        status=status,
        metrics=(
            MetricValue(name=f'{GATE_ID}.synthetic_f1', value=f1, direction='higher_is_better'),
        ),
        detail='Rescan pair should match; different amount should not',
    )
