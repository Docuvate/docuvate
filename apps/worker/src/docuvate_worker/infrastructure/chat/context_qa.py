# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import math
import os
import re
from dataclasses import dataclass

from docuvate_worker.infrastructure.chat.extractive_reader import read_span
from docuvate_worker.infrastructure.fastembed_model import embed_passages, embed_query

EXTRACTIVE_ABSTAIN_NO_MATCH = "Dazu finde ich im Dokument keinen eindeutigen Treffer"
EXTRACTIVE_ABSTAIN_NO_PASSAGE = "Dazu finde ich im Dokument keinen passenden Textabschnitt"

CHUNK_SIZE = 320
CHUNK_OVERLAP = 64
TOP_K = 6
HYBRID_DENSE_WEIGHT = 0.55
HYBRID_SPARSE_WEIGHT = 0.45
MAX_RAG_CONTEXT_CHARS = 2400

_TOKEN_RE = re.compile(r"[\wäöüß]+", flags=re.UNICODE)
_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")
_MIN_CANDIDATE_LINE_LEN = 12
_EU_AMOUNT_RE = re.compile(r"\d[\d.]*,\d{2}")
_DUE_DAY_RE = re.compile(r"\d+\.\s*Werktag", flags=re.IGNORECASE)
_TOTAL_HINT_VEC: list[float] | None = None


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


def _min_field_score() -> float:
    raw = os.environ.get("DOCUVATE_FIELD_ANSWER_GATE_MIN")
    if raw:
        try:
            return float(raw)
        except ValueError:
            pass
    return 0.55


def _answer_from_fields_embedding(question: str, fields: list[dict[str, str]]) -> str | None:
    lines = _field_lines(fields)
    if not lines:
        return None
    query_vec = embed_query(question)
    line_vecs = embed_passages(lines)
    best_idx = 0
    best_score = -1.0
    for idx, vec in enumerate(line_vecs):
        score = _cosine(query_vec, vec)
        if score > best_score:
            best_score = score
            best_idx = idx
    if best_score < _min_field_score():
        return None
    value = str(fields[best_idx].get("value", "")).strip()
    if value:
        return f"{value}."
    return f"{lines[best_idx]}."


def _min_dense_score() -> float:
    raw = os.environ.get("DOCUVATE_DENSE_RETRIEVAL_GATE_MIN")
    if raw:
        try:
            return float(raw)
        except ValueError:
            pass
    return 0.75


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


@dataclass(frozen=True)
class DocumentContextInput:
    title: str
    filename: str
    text: str
    fields: list[dict[str, str]]


def extractive_answer_abstained(reply: str) -> bool:
    """True when the extractive QA path declined to answer from retrieved evidence."""
    trimmed = reply.strip()
    if trimmed.startswith(EXTRACTIVE_ABSTAIN_NO_MATCH):
        return True
    if trimmed.startswith(EXTRACTIVE_ABSTAIN_NO_PASSAGE):
        return True
    return trimmed.startswith("Für dieses Dokument liegt noch kein extrahierter Text")


_CHUNK_TAG_RE = re.compile(r"^\[([^\]]+)\]\s*")


def _chunk_passes_retrieval_threshold(
    dense_score: float,
    _sparse_score: float,
) -> bool:
    return dense_score >= _min_dense_score()


def _select_ranked_chunks(
    chunks: list[str],
    ranked: list[int],
    dense_scores: list[float],
    sparse_scores: list[float],
    *,
    top_k: int,
) -> list[str]:
    selected: list[str] = []
    for idx in ranked:
        if len(selected) >= top_k:
            break
        if not _chunk_passes_retrieval_threshold(dense_scores[idx], sparse_scores[idx]):
            continue
        piece = chunks[idx]
        if piece not in selected:
            selected.append(piece)
    return selected


def _source_tags_from_chunks(chunks: list[str]) -> list[str]:
    tags: list[str] = []
    for chunk in chunks:
        match = _CHUNK_TAG_RE.match(chunk)
        if match:
            tag = match.group(1).strip()
            if tag and tag not in tags:
                tags.append(tag)
    return tags


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

    selected = _select_ranked_chunks(
        chunks,
        ranked,
        dense_scores,
        sparse_scores,
        top_k=top_k,
    )

    context_parts: list[str] = []
    total = 0
    for piece in selected:
        separator = 3 if context_parts else 0
        if total + separator + len(piece) > MAX_RAG_CONTEXT_CHARS:
            remaining = MAX_RAG_CONTEXT_CHARS - total - separator
            if remaining > 80:  # noqa: PLR2004
                context_parts.append(piece[:remaining].rstrip() + "…")
            break
        context_parts.append(piece)
        total += separator + len(piece)

    context_text = "\n---\n".join(context_parts)
    if filename.strip() and context_text:
        context_text = f"(Quelle: {filename.strip()})\n{context_text}"
    return RagRetrievalResult(chunks=selected, context_text=context_text)


def retrieve_library_rag_context(
    question: str,
    documents: list[DocumentContextInput],
    *,
    top_k: int = TOP_K,
) -> RagRetrievalResult:
    """Retrieve across multiple documents (global-chat style corpus union)."""
    trimmed = question.strip()
    if not trimmed or not documents:
        return RagRetrievalResult(chunks=[], context_text="")

    tagged_chunks: list[str] = []
    for doc in documents:
        corpus = _build_chunk_corpus(title=doc.title, text=doc.text, fields=doc.fields)
        for piece in corpus:
            tag = doc.filename.strip() or doc.title.strip() or "Dokument"
            tagged_chunks.append(f"[{tag}] {piece}")

    if not tagged_chunks:
        return RagRetrievalResult(chunks=[], context_text="")

    query_vec = embed_query(trimmed)
    chunk_vecs = embed_passages(tagged_chunks)
    dense_scores = [_cosine(query_vec, vec) for vec in chunk_vecs]

    corpus_size = len(tagged_chunks)
    df: dict[str, int] = {}
    for chunk in tagged_chunks:
        for tok in set(_tokenize(chunk)):
            df[tok] = df.get(tok, 0) + 1
    avgdl = sum(len(_tokenize(c)) for c in tagged_chunks) / max(corpus_size, 1)
    sparse_scores = [
        _bm25_score(trimmed, chunk, avgdl=avgdl, df=df, corpus_size=corpus_size)
        for chunk in tagged_chunks
    ]

    norm_dense = _normalize_scores(dense_scores)
    norm_sparse = _normalize_scores(sparse_scores)
    hybrid = [
        HYBRID_DENSE_WEIGHT * d + HYBRID_SPARSE_WEIGHT * s
        for d, s in zip(norm_dense, norm_sparse, strict=True)
    ]
    ranked = sorted(range(len(tagged_chunks)), key=lambda i: hybrid[i], reverse=True)

    selected = _select_ranked_chunks(
        tagged_chunks,
        ranked,
        dense_scores,
        sparse_scores,
        top_k=top_k,
    )

    context_parts: list[str] = []
    total = 0
    for piece in selected:
        separator = 3 if context_parts else 0
        if total + separator + len(piece) > MAX_RAG_CONTEXT_CHARS:
            remaining = MAX_RAG_CONTEXT_CHARS - total - separator
            if remaining > 80:  # noqa: PLR2004
                context_parts.append(piece[:remaining].rstrip() + "…")
            break
        context_parts.append(piece)
        total += separator + len(piece)

    context_text = "\n---\n".join(context_parts)
    return RagRetrievalResult(chunks=selected, context_text=context_text)


def _candidate_lines(context: str) -> list[str]:
    primary = context.split("\n---\n", maxsplit=1)[0]
    parts: list[str] = []
    for line in primary.split("\n"):
        stripped = line.strip()
        if not stripped:
            continue
        for piece in _SENTENCE_SPLIT.split(stripped):
            candidate = piece.strip()
            if len(candidate) >= _MIN_CANDIDATE_LINE_LEN and not candidate.startswith("(Quelle:"):
                parts.append(candidate)
        if len(stripped) >= _MIN_CANDIDATE_LINE_LEN and stripped not in parts:
            parts.append(stripped)
    return parts


def _total_amount_hint_vector() -> list[float]:
    global _TOTAL_HINT_VEC  # noqa: PLW0603
    if _TOTAL_HINT_VEC is None:
        _TOTAL_HINT_VEC = embed_passages(["Gesamtsumme Rechnungsbetrag Gesamtbetrag Endbetrag"])[0]
    return _TOTAL_HINT_VEC


def _best_sentence_across_chunks(question: str, chunks: list[str]) -> str | None:
    if not chunks:
        return None
    query_vec = embed_query(question)
    scored: list[tuple[float, str]] = []
    gate = float(os.environ.get("DOCUVATE_SENTENCE_ANSWER_GATE_MIN", "0.68"))
    for chunk in chunks:
        for line in _candidate_lines(chunk):
            line_vec = embed_passages([line])[0]
            score = _cosine(query_vec, line_vec)
            scored.append((score, line))
    if not scored:
        return None
    scored.sort(key=lambda row: row[0], reverse=True)
    best_score = scored[0][0]
    if best_score < gate:
        return None
    margin = float(os.environ.get("DOCUVATE_SENTENCE_ANSWER_MARGIN", "0.03"))
    near = [row for row in scored if row[0] >= best_score - margin]
    amount_lines = [row for row in near if _EU_AMOUNT_RE.search(row[1])]
    if amount_lines:
        near = amount_lines
    due_lines = [row for row in near if _DUE_DAY_RE.search(row[1])]
    if due_lines:
        near = due_lines
    if len(near) > 1 and amount_lines:
        total_vec = _total_amount_hint_vector()
        near.sort(
            key=lambda row: (
                row[0] + 0.15 * _cosine(embed_passages([row[1]])[0], total_vec),
                row[0],
            ),
            reverse=True,
        )
    else:
        near.sort(key=lambda row: row[0], reverse=True)
    return near[0][1]


def _sentence_from_context(question: str, context: str) -> str | None:
    span = read_span(question, context)
    if span is not None:
        return span.text
    sentences = _candidate_lines(context)
    if not sentences:
        return None
    query_vec = embed_query(question)
    sent_vecs = embed_passages(sentences)
    best_idx = 0
    best_score = -1.0
    for idx, vec in enumerate(sent_vecs):
        score = _cosine(query_vec, vec)
        if score > best_score:
            best_score = score
            best_idx = idx
    if best_score < float(os.environ.get("DOCUVATE_SENTENCE_ANSWER_GATE_MIN", "0.68")):
        return None
    return sentences[best_idx]


def answer_from_library_context(
    question: str,
    documents: list[DocumentContextInput],
) -> str:
    trimmed = question.strip()
    if not trimmed:
        return "Bitte eine Frage zum Dokument stellen."
    if len(documents) == 1:
        doc = documents[0]
        return answer_from_document_context(
            trimmed,
            title=doc.title,
            filename=doc.filename,
            text=doc.text,
            fields=doc.fields,
        )

    retrieval = retrieve_library_rag_context(trimmed, documents)
    if not retrieval.chunks:
        return EXTRACTIVE_ABSTAIN_NO_PASSAGE + "."

    sentence = _best_sentence_across_chunks(trimmed, retrieval.chunks)
    if sentence:
        cited = _source_tags_from_chunks(retrieval.chunks)
        sources = ", ".join(sorted(cited)) if cited else "Dokumente"
        return f"{sentence} (Quellen: {sources})."
    return EXTRACTIVE_ABSTAIN_NO_MATCH + "."


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
        return f"{EXTRACTIVE_ABSTAIN_NO_PASSAGE}."

    sentence = _best_sentence_across_chunks(trimmed, retrieval.chunks)
    if sentence:
        return f"{sentence} (Quelle: {filename or 'Dokument'})."
    field_answer = _answer_from_fields_embedding(trimmed, fields)
    if field_answer:
        return field_answer
    return EXTRACTIVE_ABSTAIN_NO_MATCH + "."


@dataclass(frozen=True)
class ExtractivePassageAnswer:
    passage_id: str
    answer: str
    quote: str


def extractive_answer_from_passages(
    question: str,
    passages: list[tuple[str, str]],
) -> ExtractivePassageAnswer | None:
    """Reader-first answer from pre-ranked API passages (section-level chunk bodies)."""
    trimmed = question.strip()
    if not trimmed or not passages:
        return None
    for passage_id, text in passages:
        body = text.strip()
        if not body:
            continue
        sentence = _sentence_from_context(trimmed, body)
        if sentence:
            quote = sentence.strip()
            return ExtractivePassageAnswer(
                passage_id=passage_id,
                answer=quote if quote.endswith((".", "!", "?")) else f"{quote}.",
                quote=quote,
            )
    return None
