# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from docuvate_worker.infrastructure.fastembed_model import MODEL_NAME, embed_passages, embed_query

MAX_CHARS = 8000


def prepare_text(text: str) -> str:
    trimmed = text.strip()
    if len(trimmed) <= MAX_CHARS:
        return trimmed
    return trimmed[:MAX_CHARS]


def embed_texts(texts: list[str], *, input_type: str = "passage") -> tuple[str, list[list[float]]]:
    prepared = [prepare_text(t) for t in texts]
    if input_type == "query":
        return MODEL_NAME, [embed_query(t) for t in prepared]
    return MODEL_NAME, embed_passages(prepared)
