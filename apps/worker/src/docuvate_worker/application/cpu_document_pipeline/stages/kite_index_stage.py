# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from docuvate_worker.domain.cpu_pipeline.contracts import (
    KiteIndexChunk,
    KiteIndexStageData,
    PipelineMutableState,
    StageAvailability,
    StageEnvelope,
)
from docuvate_worker.domain.cpu_pipeline.kite_chunks import split_passage_chunks
from docuvate_worker.domain.cpu_pipeline.metrics import measure_stage
from docuvate_worker.infrastructure.fastembed_model import embed_passages

STAGE_ID = "kite_index"


def run_kite_index_stage(state: PipelineMutableState) -> StageEnvelope[KiteIndexStageData]:
    def _run() -> tuple[KiteIndexStageData, StageAvailability, str | None]:
        text = state.text.strip()
        if not text:
            return (
                KiteIndexStageData(chunks=(), candidate_reader_available=False),
                StageAvailability.UNCERTAIN,
                "no text to index",
            )
        sentence_chunks = split_passage_chunks(text)
        if not sentence_chunks:
            return (
                KiteIndexStageData(chunks=(), candidate_reader_available=False),
                StageAvailability.UNCERTAIN,
                "chunking produced no segments",
            )
        try:
            vectors = embed_passages(sentence_chunks)
        except Exception as exc:
            return (
                KiteIndexStageData(chunks=(), candidate_reader_available=False),
                StageAvailability.NOT_AVAILABLE,
                f"embedding model unavailable: {type(exc).__name__}",
            )
        indexed: list[KiteIndexChunk] = []
        for idx, (chunk, vec) in enumerate(zip(sentence_chunks, vectors, strict=True)):
            indexed.append(
                KiteIndexChunk(
                    chunk_id=f"sentence-{idx}",
                    level="sentence",
                    text=chunk,
                    embedding_dim=len(vec),
                )
            )
        doc_vec = embed_passages([text[:4000]])
        dim = len(doc_vec[0]) if doc_vec else 0
        indexed.append(
            KiteIndexChunk(
                chunk_id="document-root",
                level="document",
                text=text[:4000],
                embedding_dim=dim,
            )
        )
        return (
            KiteIndexStageData(chunks=tuple(indexed), candidate_reader_available=False),
            StageAvailability.OK,
            "K5 index built; candidate span reader not available",
        )

    (data, availability, detail), metrics = measure_stage(_run)
    return StageEnvelope(
        stage_id=STAGE_ID,
        availability=availability,
        metrics=metrics,
        data=data,
        detail=detail,
    )
