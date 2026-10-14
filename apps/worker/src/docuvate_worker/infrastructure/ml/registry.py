# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Model artifact resolution hooks (stub — inference still uses env defaults)."""

from __future__ import annotations

import os
from dataclasses import dataclass

from docuvate_worker.domain.representation.constants import ENCODER_ID, ENCODER_REVISION
from docuvate_worker.infrastructure.ml.config import mlops_registry_enabled


@dataclass(frozen=True)
class ResolvedModel:
    family_id: str
    version_tag: str
    artifact_uri: str | None
    source: str


def resolve_active_model(family_id: str) -> ResolvedModel:
    """Return env-backed defaults until registry-backed weights are wired."""
    if family_id in ("fastembed-minilm", "fastembed-e5-small", "document-encoder"):
        return ResolvedModel(
            family_id=family_id,
            version_tag=os.environ.get("DOCUVATE_ENCODER_REVISION", ENCODER_REVISION),
            artifact_uri=os.environ.get("FASTEMBED_MODEL_NAME", ENCODER_ID),
            source="env",
        )
    if family_id == "paddle-ocr":
        return ResolvedModel(
            family_id=family_id,
            version_tag=os.environ.get("PADDLE_OCR_MODEL_VERSION", "bootstrap-1"),
            artifact_uri=os.environ.get("PADDLE_OCR_LANG", "german"),
            source="env",
        )
    if family_id == "layout-niw":
        return ResolvedModel(
            family_id=family_id,
            version_tag=os.environ.get("EMBEDDING_DENSITY_MODEL_VERSION", "bootstrap-1"),
            artifact_uri=None,
            source="env",
        )
    if family_id == "value-types-vgram":
        from docuvate_worker.infrastructure.ml.value_types.registry import (  # noqa: PLC0415
            artifact_path,
        )

        return ResolvedModel(
            family_id=family_id,
            version_tag=os.environ.get("DOCUVATE_VALUE_TYPES_VERSION", "cord-synth-v1"),
            artifact_uri=str(artifact_path()),
            source="bundled",
        )
    return ResolvedModel(
        family_id=family_id,
        version_tag="bootstrap-1",
        artifact_uri=None,
        source="env" if not mlops_registry_enabled() else "registry-stub",
    )
