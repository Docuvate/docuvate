# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Calibrated NIW-Student-t density classification over document embeddings."""

from docuvate_worker.domain.embedding_density.decision import (
    DecisionOutcome,
    DecisionTier,
    ReasonCode,
)
from docuvate_worker.domain.embedding_density.model import EmbeddingDensityModel

__all__ = [
    "DecisionOutcome",
    "DecisionTier",
    "EmbeddingDensityModel",
    "ReasonCode",
]
