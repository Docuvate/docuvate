# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from docuvate_worker.infrastructure.ml.ce_ml.missing_label import (
    MissingLabelBatchTarget,
    missing_label_hint_score,
    missing_label_hint_scores_batch,
)


def test_unexplained_mass_high_when_neighbor_labels_not_assigned() -> None:
    vectors = [
        [1.0, 0.0],
        [0.99, 0.01],
        [0.0, 1.0],
    ]
    texts = ["alpha invoice", "alpha invoice copy", "payroll salary"]
    tags = [["tag-a"], ["tag-a"], ["tag-b"]]
    hint = missing_label_hint_score(
        passage_vectors=vectors,
        passage_texts=texts,
        tag_ids_per_document=tags,
        target_document_index=0,
        assigned_tag_ids=["tag-a"],
        labeled_document_indices=[0, 1, 2],
    )
    assert hint.score >= 0.0


def test_missing_label_batch_matches_single_scores() -> None:
    vectors = [
        [1.0, 0.0],
        [0.99, 0.01],
        [0.0, 1.0],
    ]
    texts = ["alpha invoice", "alpha invoice copy", "payroll salary"]
    tags = [["tag-a"], ["tag-a"], ["tag-b"]]
    labeled = [0, 1, 2]
    single = missing_label_hint_score(
        passage_vectors=vectors,
        passage_texts=texts,
        tag_ids_per_document=tags,
        target_document_index=0,
        assigned_tag_ids=["tag-a"],
        labeled_document_indices=labeled,
    )
    batch = missing_label_hint_scores_batch(
        passage_vectors=vectors,
        passage_texts=texts,
        tag_ids_per_document=tags,
        targets=[MissingLabelBatchTarget(target_document_index=0, assigned_tag_ids=["tag-a"])],
        labeled_document_indices=labeled,
    )
    assert len(batch) == 1
    assert batch[0].score == single.score
    assert batch[0].show == single.show
