# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from docuvate_worker.infrastructure.ml.ce_ml.calibration import missing_label_threshold
from docuvate_worker.infrastructure.ml.ner.doc_ner import NerWord, predict_doc_ner_spans
from docuvate_worker.infrastructure.onnx_e5_encoder import embed_texts_onnx


@dataclass(frozen=True)
class MissingLabelHint:
    score: float
    show: bool


def _content_tokens(words: list[str]) -> list[str]:
    return [word.lower() for word in words if word.isalpha() and len(word) >= 3]


def missing_label_hint_score(
    *,
    example_token_sets: list[set[str]],
    document_words: list[NerWord],
    page_width: float,
    page_height: float,
) -> MissingLabelHint:
    threshold = missing_label_threshold()
    if not example_token_sets or not document_words:
        return MissingLabelHint(score=0.0, show=False)
    spans = predict_doc_ner_spans(document_words, page_width=page_width, page_height=page_height)
    ner_other_indices = set(range(len(document_words)))
    for span in spans:
        for idx in range(span.start_index, span.end_index):
            ner_other_indices.discard(idx)
    tokens = _content_tokens([document_words[i].text for i in sorted(ner_other_indices)])
    if not tokens:
        return MissingLabelHint(score=0.0, show=False)
    token_vectors = np.asarray(embed_texts_onnx([f"passage: {token}" for token in tokens]), dtype=np.float32)
    example_vectors = [
        np.asarray(
            embed_texts_onnx([f"passage: {token}" for token in sorted(example_tokens)]),
            dtype=np.float32,
        )
        for example_tokens in example_token_sets
        if example_tokens
    ]
    if not example_vectors:
        return MissingLabelHint(score=0.0, show=False)
    basis_rows: list[np.ndarray] = []
    for matrix in example_vectors:
        centered = matrix - matrix.mean(axis=0, keepdims=True)
        if centered.shape[0] == 0:
            continue
        _, _, vt = np.linalg.svd(centered, full_matrices=False)
        explained = min(8, vt.shape[0])
        basis_rows.append(vt[:explained])
    if not basis_rows:
        return MissingLabelHint(score=0.0, show=False)
    basis = np.vstack(basis_rows)
    centered_doc = token_vectors - token_vectors.mean(axis=0, keepdims=True)
    explained_variance = ((centered_doc @ basis.T) ** 2).sum(axis=1) / (
        (centered_doc**2).sum(axis=1) + 1e-9
    )
    coverage = float(1.0 - explained_variance.mean())
    return MissingLabelHint(score=coverage, show=coverage >= threshold)
