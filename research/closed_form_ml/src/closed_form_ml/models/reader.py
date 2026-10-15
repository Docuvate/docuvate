# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import re
from dataclasses import dataclass

import numpy as np

from closed_form_ml.embeddings import embed_passages, embed_queries, l2_normalize
from closed_form_ml.interfaces import ReaderSpan
from closed_form_ml.layers import append_bias, ridge_solve


def _sentences(text: str) -> list[tuple[int, int, str]]:
    spans: list[tuple[int, int, str]] = []
    for match in re.finditer(r"[^\n.!?]+[.!?]?", text):
        s = match.group(0).strip()
        if s:
            spans.append((match.start(), match.end(), s))
    if not spans:
        spans.append((0, len(text), text.strip()))
    return spans


@dataclass
class TokenOverlapReader:
    """CE fallback: token overlap between question and sentences."""

    def answer(self, question: str, context: str) -> ReaderSpan | None:
        q_tokens = set(re.findall(r"\w+", question.lower()))
        best: ReaderSpan | None = None
        for start, end, sent in _sentences(context):
            s_tokens = set(re.findall(r"\w+", sent.lower()))
            overlap = len(q_tokens & s_tokens)
            if overlap == 0:
                continue
            score = overlap / max(len(q_tokens), 1)
            if best is None or score > best.score:
                best = ReaderSpan(sent.strip(), float(score), start, end)
        return best


@dataclass
class E5SentenceReader:
    """Closed-form: pick sentence with max cosine(query, sentence)."""

    def answer(self, question: str, context: str) -> ReaderSpan | None:
        sents = _sentences(context)
        if not sents:
            return None
        texts = [s[2] for s in sents]
        q = l2_normalize(embed_queries([question]))[0]
        p = l2_normalize(embed_passages(texts))
        scores = p @ q
        q_lower = question.lower()
        amount_q = any(
            token in q_lower
            for token in ("wie viel", "betrag", "summe", "überweisen", "fällig", "endbetrag")
        )
        for i, sent in enumerate(texts):
            if amount_q and re.search(r"\d+[.,]\d{2}", sent):
                if any(
                    hint in sent.lower()
                    for hint in ("gesamtsumme", "rechnungsbetrag", "endbetrag", "brutto")
                ):
                    scores[i] += 0.35
                else:
                    scores[i] += 0.08
        idx = int(np.argmax(scores))
        start, end, sent = sents[idx]
        return ReaderSpan(sent.strip(), float(scores[idx]), start, end)


@dataclass
class RidgeSpanReader:
    """Closed-form ridge scores sentence spans using e5 query/passage dot products."""

    weights: np.ndarray | None = None

    def fit(self, questions: list[str], contexts: list[str], answer_spans: list[str]) -> None:
        feats: list[list[float]] = []
        labels: list[float] = []
        for q, ctx, ans in zip(questions, contexts, answer_spans, strict=True):
            if not ans:
                continue
            q_vec = l2_normalize(embed_queries([q]))[0]
            for _start, _end, sent in _sentences(ctx):
                p_vec = l2_normalize(embed_passages([sent]))[0]
                feat = np.concatenate([q_vec, p_vec, q_vec * p_vec]).tolist()
                label = 1.0 if ans.lower() in sent.lower() else 0.0
                feats.append(feat)
                labels.append(label)
        if not feats:
            self.weights = None
            return
        x = np.asarray(feats, dtype=np.float64)
        y = np.asarray(labels, dtype=np.float64).reshape(-1, 1)
        self.weights = ridge_solve(append_bias(x), y, reg=1e-2)

    def answer(self, question: str, context: str) -> ReaderSpan | None:
        if self.weights is None:
            return E5SentenceReader().answer(question, context)
        q_vec = l2_normalize(embed_queries([question]))[0]
        best: ReaderSpan | None = None
        for start, end, sent in _sentences(context):
            p_vec = l2_normalize(embed_passages([sent]))[0]
            feat = np.concatenate([q_vec, p_vec, q_vec * p_vec])
            logit = float(append_bias(feat.reshape(1, -1)) @ self.weights)
            score = 1.0 / (1.0 + np.exp(-logit))
            if best is None or score > best.score:
                best = ReaderSpan(sent.strip(), score, start, end)
        return best


@dataclass
class XlmRobertaReader:
    """Optional baseline (transformers); skipped when DOCUVATE_AI_PROFILE=off."""

    def answer(self, question: str, context: str) -> ReaderSpan | None:
        try:
            from docuvate_worker.infrastructure.chat.extractive_reader import read_span  # noqa: PLC0415
        except ImportError:
            return None
        span = read_span(question, context)
        if span is None:
            return None
        idx = context.find(span.text)
        start = max(idx, 0)
        end = start + len(span.text)
        return ReaderSpan(span.text, span.score, start, end)
