# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass

from docuvate_worker.domain.representation.constants import (
    EMBEDDING_DIM,
    ENCODER_ID,
    ENCODER_REVISION,
    REPRESENTATION_VERSION,
)
from docuvate_worker.domain.representation.quantize import (
    aggregate_document_vectors,
    binary_code,
    quantize_vector,
)
from docuvate_worker.domain.representation.units import RepresentationUnit
from docuvate_worker.infrastructure.extractors.field_extraction_context import (
    clear_passage_vector_cache,
    register_passage_vectors,
)
from docuvate_worker.infrastructure.fastembed_model import embed_passages, encoder_embed_batch_size


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
    clear_passage_vector_cache()
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
    batch_size = encoder_embed_batch_size()
    encoded_units: list[EncodedUnit] = []
    sum_vec: list[float] = []
    max_vec: list[float] = []
    have_aggregate = False
    count = 0
    passage_cache: dict[str, list[float]] = {}
    for start in range(0, len(texts), batch_size):
        batch_units = units[start : start + batch_size]
        batch_texts = texts[start : start + batch_size]
        batch_vectors = embed_passages(batch_texts)
        for text, vector in zip(batch_texts, batch_vectors, strict=True):
            stripped = text.strip()
            if stripped:
                passage_cache[stripped] = vector
        for unit, vector in zip(batch_units, batch_vectors, strict=True):
            scale, int8 = quantize_vector(vector)
            encoded_units.append(
                EncodedUnit(
                    unit=unit,
                    scale=scale,
                    vector_int8=int8,
                    binary=binary_code(vector),
                )
            )
            count += 1
            if not have_aggregate:
                sum_vec = list(vector)
                max_vec = list(vector)
                have_aggregate = True
            else:
                sum_vec = [a + b for a, b in zip(sum_vec, vector, strict=True)]
                max_vec = [max(a, b) for a, b in zip(max_vec, vector, strict=True)]
    register_passage_vectors(passage_cache)
    if not have_aggregate or count == 0:
        mean_float, max_float = aggregate_document_vectors([])
    else:
        mean_float = [value / count for value in sum_vec]
        max_float = max_vec
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
