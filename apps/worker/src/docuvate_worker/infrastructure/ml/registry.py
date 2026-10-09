# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Model artifact resolution hooks (stub — inference still uses env defaults)."""

from __future__ import annotations

import os
from dataclasses import dataclass

from docuvate_worker.infrastructure.ml.config import mlops_registry_enabled


@dataclass(frozen=True)
class ResolvedModel:
    family_id: str
    version_tag: str
    artifact_uri: str | None
    source: str


def resolve_active_model(family_id: str) -> ResolvedModel:
    """Return env-backed defaults until registry-backed weights are wired."""
    if family_id == "fastembed-minilm":
        return ResolvedModel(
            family_id=family_id,
            version_tag=os.environ.get("FASTEMBED_MODEL_VERSION", "bootstrap-1"),
            artifact_uri=os.environ.get("FASTEMBED_MODEL_NAME"),
            source="env",
        )
    if family_id == "paddle-ocr":
        return ResolvedModel(
            family_id=family_id,
            version_tag=os.environ.get("PADDLE_OCR_MODEL_VERSION", "bootstrap-1"),
            artifact_uri=os.environ.get("PADDLE_OCR_LANG", "german"),
            source="env",
        )
    return ResolvedModel(
        family_id=family_id,
        version_tag="bootstrap-1",
        artifact_uri=None,
        source="env" if not mlops_registry_enabled() else "registry-stub",
    )
