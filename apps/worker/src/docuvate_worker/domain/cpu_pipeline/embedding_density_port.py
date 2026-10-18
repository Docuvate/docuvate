# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Port for per-org calibrated embedding-density state (API / labeling contract)."""

from __future__ import annotations

from typing import Protocol

from docuvate_worker.domain.embedding_density.schemas import EmbeddingDensityStatePayload


class EmbeddingDensityStatePort(Protocol):
    def resolve(self, document_id: str | None) -> EmbeddingDensityStatePayload | None: ...


class StaticEmbeddingDensityStatePort:
    """Supplies a fixed calibrated state (upload hook or tests)."""

    def __init__(self, state: EmbeddingDensityStatePayload | None) -> None:
        self._state = state

    def resolve(self, document_id: str | None) -> EmbeddingDensityStatePayload | None:
        return self._state
