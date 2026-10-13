# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from docuvate_worker.domain.smart_duplicates.config import SmartDuplicateConfig
from docuvate_worker.domain.smart_duplicates.detect import (
    SmartDuplicateCandidate,
    SmartDuplicateDocument,
    score_smart_duplicate_candidates,
)


def find_smart_duplicate_candidates(
    *,
    focus_document_id: str,
    focus_lines: list[str],
    peer_documents: list[tuple[str, list[str]]],
    config: SmartDuplicateConfig | None = None,
) -> list[SmartDuplicateCandidate]:
    focus = SmartDuplicateDocument(document_id=focus_document_id, lines=focus_lines)
    peers = [
        SmartDuplicateDocument(document_id=doc_id, lines=lines)
        for doc_id, lines in peer_documents
    ]
    return score_smart_duplicate_candidates(focus, peers, config=config)
