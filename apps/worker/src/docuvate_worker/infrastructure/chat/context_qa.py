# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import math
import re
from dataclasses import dataclass

from docuvate_worker.infrastructure.fastembed_model import embed_passages, embed_query

CHUNK_SIZE = 320
CHUNK_OVERLAP = 64
TOP_K = 5
MIN_DENSE_SCORE = 0.38
HYBRID_DENSE_WEIGHT = 0.55
HYBRID_SPARSE_WEIGHT = 0.45
MAX_RAG_CONTEXT_CHARS = 2400

SENDER_HINTS = (
    "absender",
    "sender",
    "von",
    "zahlungsempfänger",
    "empfänger",
    "firma",
    "unternehmen",
    "vendor",
    "correspondent",
)

_TOKEN_RE = re.compile(r"[\wäöüß]+", flags=re.UNICODE)


def _split_chunks(text: str) -> list[str]:
    normalized = re.sub(r"\s+", " ", text.strip())
    if not normalized:
        return []
    chunks: list[str] = []
    start = 0
    while start < len(normalized):
        end = min(len(normalized), start + CHUNK_SIZE)
        chunk = normalized[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(normalized):
            break
        start = max(0, end - CHUNK_OVERLAP)
    return chunks


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def _tokenize(s: str) -> list[str]:
    return _TOKEN_RE.findall(s.lower())


def _bm25_score(
    query: str,
    doc: str,
    *,
    avgdl: float,
    df: dict[str, int],
    corpus_size: int,
) -> float:
    k1, b = 1.5, 0.75
    q_tokens = _tokenize(query)
    d_tokens = _tokenize(doc)
    dl = len(d_tokens) or 1
    tf: dict[str, int] = {}
    for token in d_tokens:
        tf[token] = tf.get(token, 0) + 1
    score = 0.0
    for term in q_tokens:
        if term not in tf:
            continue
        idf = math.log(1 + (corpus_size - df.get(term, 0) + 0.5) / (df.get(term, 0) + 0.5))
        freq = tf[term]
        score += idf * (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * dl / avgdl))
    return score


def _normalize_scores(values: list[float]) -> list[float]:
    if not values:
        return []
    lo, hi = min(values), max(values)
    if hi <= lo:
        return [0.0] * len(values)
    return [(v - lo) / (hi - lo) for v in values]


def _field_lines(fields: list[dict[str, str]]) -> list[str]:
    lines: list[str] = []
    for field in fields:
        key = str(field.get("key", "")).strip()
        value = str(field.get("value", "")).strip()
        if key and value:
            lines.append(f"{key}: {value}")
    return lines


def _looks_like_sender_question(question: str) -> bool:
    lower = question.lower()
    return any(h in lower for h in SENDER_HINTS)


def _sender_from_fields(fields: list[dict[str, str]]) -> str | None:
    for field in fields:
        key = str(field.get("key", "")).lower()
        value = str(field.get("value", "")).strip()
        if not value:
            continue
        if any(h in key for h in ("vendor", "correspondent", "sender", "absender", "firma")):
            return value
    for field in fields:
        key = str(field.get("key", "")).lower()
        value = str(field.get("value", "")).strip()
        if "name" in key and value:
            return value
    return None


def _sender_from_text(text: str) -> str | None:
    patterns = (
        r"(?i)name des zahlungsempfängers:\s*(.+?)(?:\n|$)",
        r"(?i)zahlungsempfänger:\s*(.+?)(?:\n|$)",
        r"(?i)absender:\s*(.+?)(?:\n|$)",
        r"(?i)von:\s*(.+?)(?:\n|$)",
    )
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            candidate = match.group(1).strip(" .")
            if candidate:
                return candidate
    return None


def _build_chunk_corpus(
    *,
    title: str,
    text: str,
    fields: list[dict[str, str]],
) -> list[str]:
    body = text.strip()
    field_lines = _field_lines(fields)
    chunks = _split_chunks(body)
    if field_lines:
        chunks = [f"Extrahierte Felder: {'; '.join(field_lines)}", *chunks]
    if title.strip():
        chunks = [f"Titel: {title.strip()}", *chunks]
    return chunks


@dataclass(frozen=True)
class RagRetrievalResult:
    chunks: list[str]
    context_text: str


def retrieve_document_rag_context(
    question: str,
    *,
    title: str,
    filename: str,
    text: str,
    fields: list[dict[str, str]],
    top_k: int = TOP_K,
) -> RagRetrievalResult:
    trimmed = question.strip()
    chunks = _build_chunk_corpus(title=title, text=text, fields=fields)
    if not trimmed or not chunks:
        return RagRetrievalResult(chunks=[], context_text="")

    query_vec = embed_query(trimmed)
    chunk_vecs = embed_passages(chunks)
    dense_scores = [_cosine(query_vec, vec) for vec in chunk_vecs]

    corpus_size = len(chunks)
    df: dict[str, int] = {}
    for chunk in chunks:
        for tok in set(_tokenize(chunk)):
            df[tok] = df.get(tok, 0) + 1
    avgdl = sum(len(_tokenize(c)) for c in chunks) / max(corpus_size, 1)
    sparse_scores = [
        _bm25_score(trimmed, chunk, avgdl=avgdl, df=df, corpus_size=corpus_size) for chunk in chunks
    ]

    norm_dense = _normalize_scores(dense_scores)
    norm_sparse = _normalize_scores(sparse_scores)
    hybrid = [
        HYBRID_DENSE_WEIGHT * d + HYBRID_SPARSE_WEIGHT * s
        for d, s in zip(norm_dense, norm_sparse, strict=True)
    ]
    ranked = sorted(range(len(chunks)), key=lambda i: hybrid[i], reverse=True)

    selected: list[str] = []
    for idx in ranked:
        if len(selected) >= top_k:
            break
        if dense_scores[idx] < MIN_DENSE_SCORE and sparse_scores[idx] <= 0:
            continue
        piece = chunks[idx]
        if piece not in selected:
            selected.append(piece)

    if not selected and ranked:
        selected = [chunks[ranked[0]]]

    context_parts: list[str] = []
    total = 0
    for piece in selected:
        separator = 3 if context_parts else 0
        if total + separator + len(piece) > MAX_RAG_CONTEXT_CHARS:
            remaining = MAX_RAG_CONTEXT_CHARS - total - separator
            if remaining > 80:
                context_parts.append(piece[:remaining].rstrip() + "…")
            break
        context_parts.append(piece)
        total += separator + len(piece)

    context_text = "\n---\n".join(context_parts)
    if filename.strip() and context_text:
        context_text = f"(Quelle: {filename.strip()})\n{context_text}"
    return RagRetrievalResult(chunks=selected, context_text=context_text)


def answer_from_document_context(
    question: str,
    *,
    title: str,
    filename: str,
    text: str,
    fields: list[dict[str, str]],
) -> str:
    trimmed = question.strip()
    if not trimmed:
        return "Bitte eine Frage zum Dokument stellen."

    if _looks_like_sender_question(trimmed):
        sender = _sender_from_fields(fields) or _sender_from_text(text)
        if sender:
            return f"Absender bzw. Zahlungsempfänger laut Dokument: {sender}."

    body = text.strip()
    field_lines = _field_lines(fields)
    if not body and not field_lines:
        return (
            "Für dieses Dokument liegt noch kein extrahierter Text vor. "
            "Bitte zuerst die Extraktion ausführen (Register Details → Extraktion)."
        )

    retrieval = retrieve_document_rag_context(
        trimmed,
        title=title,
        filename=filename,
        text=text,
        fields=fields,
    )
    if not retrieval.chunks:
        fallback = body[:400] or (field_lines[0] if field_lines else title)
        if fallback:
            return (
                f"Dazu finde ich im Dokument keinen eindeutigen Treffer. "
                f"Kurzer Kontext: „{fallback}{'…' if len(body) > 400 else ''}“"
            )
        return "Dazu finde ich im Dokument keinen passenden Textabschnitt."

    excerpts = " ".join(f"„{chunk}“" for chunk in retrieval.chunks)
    lead = f"Zu „{trimmed}“: "
    return f"{lead}{excerpts} (Quelle: {filename or 'Dokument'})."
