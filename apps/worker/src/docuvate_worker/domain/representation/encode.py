# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass

from docuvate_worker.domain.representation.constants import (
    ENCODER_ID,
    ENCODER_REVISION,
    EMBEDDING_DIM,
    REPRESENTATION_VERSION,
)
from docuvate_worker.domain.representation.quantize import (
    aggregate_document_vectors,
    binary_code,
    quantize_vector,
)
from docuvate_worker.domain.representation.units import RepresentationUnit
from docuvate_worker.infrastructure.fastembed_model import embed_passages


@dataclass(frozen=True)
class EncodedUnit:
    unit: RepresentationUnit
    scale: float
    vector_int8: bytes
    binary: bytes


@dataclass(frozen=True)
class DocumentRepresentation:
    encoder_id: str
    encoder_revision: str
    representation_version: int
    units: tuple[EncodedUnit, ...]
    document_mean_scale: float
    document_mean_int8: bytes
    document_max_scale: float
    document_max_int8: bytes
    document_mean_float: tuple[float, ...]


def encode_units(units: list[RepresentationUnit]) -> DocumentRepresentation:
    if not units:
        empty = [0.0] * EMBEDDING_DIM
        scale, int8 = quantize_vector(empty)
        return DocumentRepresentation(
            encoder_id=ENCODER_ID,
            encoder_revision=ENCODER_REVISION,
            representation_version=REPRESENTATION_VERSION,
            units=(),
            document_mean_scale=scale,
            document_mean_int8=int8,
            document_max_scale=scale,
            document_max_int8=int8,
            document_mean_float=tuple(empty),
        )
    texts = [u.text for u in units]
    vectors = embed_passages(texts)
    encoded_units: list[EncodedUnit] = []
    for unit, vector in zip(units, vectors, strict=True):
        scale, int8 = quantize_vector(vector)
        encoded_units.append(
            EncodedUnit(
                unit=unit,
                scale=scale,
                vector_int8=int8,
                binary=binary_code(vector),
            )
        )
    mean_float, max_float = aggregate_document_vectors(vectors)
    mean_scale, mean_int8 = quantize_vector(mean_float)
    max_scale, max_int8 = quantize_vector(max_float)
    return DocumentRepresentation(
        encoder_id=ENCODER_ID,
        encoder_revision=ENCODER_REVISION,
        representation_version=REPRESENTATION_VERSION,
        units=tuple(encoded_units),
        document_mean_scale=mean_scale,
        document_mean_int8=mean_int8,
        document_max_scale=max_scale,
        document_max_int8=max_int8,
        document_mean_float=tuple(mean_float),
    )
