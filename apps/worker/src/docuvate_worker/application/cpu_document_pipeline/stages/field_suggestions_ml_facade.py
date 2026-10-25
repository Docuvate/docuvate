# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Typed entrypoints for optional ML field suggestions (loaded lazily via importlib)."""

from __future__ import annotations

from docuvate_worker.application.cpu_document_pipeline.stages.field_suggestions_ml import (
    release_docai_models,
    run_docai_field_suggestions,
    run_layout_kv_field_suggestions,
)

__all__ = [
    "release_docai_models",
    "run_docai_field_suggestions",
    "run_layout_kv_field_suggestions",
]
