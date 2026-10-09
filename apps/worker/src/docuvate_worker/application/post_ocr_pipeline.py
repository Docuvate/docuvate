# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Post-OCR pipeline module ids — aligned with API DocumentPipelineModuleId.

The API orchestrates label matching, embeddings, and field extraction today.
Worker steps are invoked on demand (e.g. /extract, /extract/label-fields).
A future workflow UI can enable/disable ids on both sides consistently.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class PipelineModuleDescriptor:
    id: str
    label_de: str
    default_order: int
    default_enabled: bool = True


DEFAULT_POST_OCR_DESCRIPTORS: tuple[PipelineModuleDescriptor, ...] = (
    PipelineModuleDescriptor("label_matching", "Label-Matching", 10),
    PipelineModuleDescriptor("embedding_suggestions", "Label-Vorschläge", 20),
    PipelineModuleDescriptor("global_recognized_fields", "Globale Felder", 30),
    PipelineModuleDescriptor("label_attached_fields", "Label-Felder (Archiv)", 40),
    PipelineModuleDescriptor("duplicate_detection", "Duplikate", 50),
)


class PostOcrPipelineModule(Protocol):
    descriptor: PipelineModuleDescriptor

    def run(self, *, document_id: str, user_id: str) -> None: ...


def ordered_modules(
    modules: list[PostOcrPipelineModule],
) -> list[PostOcrPipelineModule]:
    return sorted(modules, key=lambda m: m.descriptor.default_order)
