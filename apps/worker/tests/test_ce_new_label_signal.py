# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import numpy as np

from docuvate_worker.infrastructure.ml.ce_ml.new_label_signal import new_label_signals


def _corpus() -> tuple[list[list[float]], list[list[str]]]:
    rng = np.random.default_rng(7)
    centres = np.eye(3, 6) * 3.0
    groups = np.repeat(np.arange(3), 8)
    vectors = (centres[groups] + rng.normal(0.0, 0.2, size=(24, 6))).tolist()
    tags = [["a"] if g == 0 else ["b"] if g == 1 else [] for g in groups]
    return vectors, tags


def test_unseen_cluster_scores_higher_than_known_labels() -> None:
    vectors, tags = _corpus()
    signals = new_label_signals(
        passage_vectors=vectors,
        passage_texts=[""] * 24,
        tag_ids_per_document=tags,
        target_document_indices=[0, 8, 16, 17],
    )
    by_index = {signal.document_index: signal for signal in signals}
    assert by_index[16].score > by_index[0].score
    assert by_index[17].score > by_index[8].score
    assert by_index[16].show


def test_silent_with_too_few_labels() -> None:
    vectors, tags = _corpus()
    only_one = [["a"] if t == ["a"] else [] for t in tags]
    signals = new_label_signals(
        passage_vectors=vectors,
        passage_texts=[""] * 24,
        tag_ids_per_document=only_one,
        target_document_indices=[16],
    )
    assert not signals[0].show
