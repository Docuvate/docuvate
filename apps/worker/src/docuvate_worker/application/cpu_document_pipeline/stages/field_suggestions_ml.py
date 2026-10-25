# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Optional ML field suggestions (imported lazily via importlib from fields_stage)."""

from __future__ import annotations

from docuvate_worker.domain.models import ExtractedField, ExtractionBlock
from docuvate_worker.domain.representation.encode import DocumentRepresentation
from docuvate_worker.infrastructure.ml.ce_ml.docai_field_suggestions import (
    docai_kv_field_suggestions,
)
from docuvate_worker.infrastructure.ml.docai.inference import release_docai_runtime
from docuvate_worker.infrastructure.ml.layout_kv_roles import layout_kv_field_suggestions


def run_layout_kv_field_suggestions(
    blocks: list[ExtractionBlock],
    document_representation: DocumentRepresentation | None,
    *,
    recognized_field_keys: frozenset[str] | None,
    existing_field_keys: frozenset[str],
) -> list[ExtractedField]:
    return layout_kv_field_suggestions(
        blocks,
        document_representation,
        recognized_field_keys=recognized_field_keys,
        existing_field_keys=existing_field_keys,
    )


def run_docai_field_suggestions(
    blocks: list[ExtractionBlock],
    *,
    recognized_field_keys: frozenset[str] | None,
    existing_field_keys: frozenset[str],
) -> list[ExtractedField]:
    return docai_kv_field_suggestions(
        blocks,
        recognized_field_keys=recognized_field_keys,
        existing_field_keys=existing_field_keys,
    )


def release_docai_models() -> None:
    release_docai_runtime()
