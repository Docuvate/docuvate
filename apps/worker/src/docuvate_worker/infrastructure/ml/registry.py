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
    if family_id in ("fastembed-minilm", "fastembed-e5-small", "document-encoder"):
        return ResolvedModel(
            family_id=family_id,
            version_tag=os.environ.get(
                "FASTEMBED_MODEL_VERSION",
                os.environ.get("DOCUVATE_ENCODER_REVISION", "bootstrap-1"),
            ),
            artifact_uri=os.environ.get("FASTEMBED_MODEL_NAME", "intfloat/multilingual-e5-small"),
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
    if family_id == "layout-kv-role-head":
        return ResolvedModel(
            family_id=family_id,
            version_tag=os.environ.get("LAYOUT_KV_ROLE_HEAD_VERSION", "v1"),
            artifact_uri=os.environ.get(
                "LAYOUT_KV_ROLE_HEAD_PATH",
                "apps/worker/src/docuvate_worker/infrastructure/ml/artifacts/layout-kv-role-head.v1.json",
            ),
            source="bundled",
        )
    return ResolvedModel(
        family_id=family_id,
        version_tag="bootstrap-1",
        artifact_uri=None,
        source="env" if not mlops_registry_enabled() else "registry-stub",
    )
