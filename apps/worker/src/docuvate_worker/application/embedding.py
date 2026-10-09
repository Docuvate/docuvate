# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from docuvate_worker.infrastructure.fastembed_model import MODEL_NAME, embed_passages

MAX_CHARS = 8000


def prepare_text(text: str) -> str:
    trimmed = text.strip()
    if len(trimmed) <= MAX_CHARS:
        return trimmed
    return trimmed[:MAX_CHARS]


def embed_texts(texts: list[str]) -> tuple[str, list[list[float]]]:
    prepared = [prepare_text(t) for t in texts]
    return MODEL_NAME, embed_passages(prepared)
