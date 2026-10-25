# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import math
import re
from collections.abc import Sequence

import numpy as np
from numpy.typing import NDArray

FloatArray = NDArray[np.float32]

_TOKEN_RE = re.compile(r"[^\W\d_]{2,}", re.UNICODE)
_MAX_VOCAB = 50_000
_MIN_DF = 2


def _tokenize(text: str) -> list[str]:
    return [match.group(0).lower() for match in _TOKEN_RE.finditer(text)]


def build_tfidf_matrix(texts: Sequence[str]) -> FloatArray:
    if not texts:
        return np.zeros((0, 0), dtype=np.float32)
    doc_tokens = [_tokenize(text) for text in texts]
    df: dict[str, int] = {}
    for tokens in doc_tokens:
        seen: set[str] = set()
        for token in tokens:
            if token in seen:
                continue
            seen.add(token)
            df[token] = df.get(token, 0) + 1
    vocabulary = [
        token
        for token, count in sorted(df.items(), key=lambda item: (-item[1], item[0]))
        if count >= _MIN_DF
    ][: _MAX_VOCAB]
    if not vocabulary:
        return np.zeros((len(texts), 0), dtype=np.float32)
    vocab_index = {token: idx for idx, token in enumerate(vocabulary)}
    n_docs = len(texts)
    idf = np.array(
        [math.log((1 + n_docs) / (1 + df[token])) + 1.0 for token in vocabulary],
        dtype=np.float32,
    )
    matrix = np.zeros((n_docs, len(vocabulary)), dtype=np.float32)
    for row, tokens in enumerate(doc_tokens):
        counts: dict[str, int] = {}
        for token in tokens:
            if token in vocab_index:
                counts[token] = counts.get(token, 0) + 1
        total = float(sum(counts.values())) or 1.0
        for token, count in counts.items():
            col = vocab_index[token]
            tf = count / total
            matrix[row, col] = tf * idf[col]
        norm = float(np.linalg.norm(matrix[row]))
        if norm > 0:
            matrix[row] /= norm
    return matrix
