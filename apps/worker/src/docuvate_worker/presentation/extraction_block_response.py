# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from docuvate_worker.domain.extraction_geometry import sanitize_extraction_blocks
from docuvate_worker.domain.models import ExtractionBlock
from docuvate_worker.presentation.schemas import ExtractionBlockModel


def extraction_blocks_to_models(
    blocks: list[ExtractionBlock] | None,
    *,
    context: str,
) -> list[ExtractionBlockModel]:
    safe = sanitize_extraction_blocks(blocks, context=context) or []
    models: list[ExtractionBlockModel] = []
    for block in safe:
        models.append(
            ExtractionBlockModel(
                page=block.page,
                x=block.x,
                y=block.y,
                width=block.width,
                height=block.height,
                text=block.text,
                block_index=block.block_index,
            )
        )
    return models
