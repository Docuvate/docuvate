# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import base64

from docuvate_worker.domain.representation.encode import DocumentRepresentation
from docuvate_worker.presentation.schemas import (
    DocumentRepresentationModel,
    RepresentationUnitModel,
)


def document_representation_to_response(
    representation: DocumentRepresentation | None,
) -> DocumentRepresentationModel | None:
    if representation is None:
        return None
    units = [
        RepresentationUnitModel(
            unit_index=encoded.unit.unit_index,
            kind=encoded.unit.kind,
            text=encoded.unit.text,
            page=encoded.unit.page,
            x=encoded.unit.x,
            y=encoded.unit.y,
            width=encoded.unit.width,
            height=encoded.unit.height,
            char_start=encoded.unit.char_start,
            char_end=encoded.unit.char_end,
            vector_scale=encoded.scale,
            vector_int8_base64=base64.b64encode(encoded.vector_int8).decode("ascii"),
            binary_code_base64=base64.b64encode(encoded.binary).decode("ascii"),
        )
        for encoded in representation.units
    ]
    return DocumentRepresentationModel(
        encoder_id=representation.encoder_id,
        encoder_revision=representation.encoder_revision,
        representation_version=representation.representation_version,
        units=units,
        document_mean_scale=representation.document_mean_scale,
        document_mean_int8_base64=base64.b64encode(representation.document_mean_int8).decode(
            "ascii"
        ),
        document_max_scale=representation.document_max_scale,
        document_max_int8_base64=base64.b64encode(representation.document_max_int8).decode(
            "ascii"
        ),
    )
