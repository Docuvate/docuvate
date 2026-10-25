# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import numpy as np

from docuvate_worker.infrastructure.ml.ce_ml.conformal_threshold import (
    split_conformal_accept_threshold,
)


def test_split_conformal_prefers_high_scores_for_positives() -> None:
    scores = np.array([0.9, 0.8, 0.2, 0.1], dtype=np.float32)
    labels = np.array([1.0, 1.0, 0.0, 0.0], dtype=np.float32)
    tau = split_conformal_accept_threshold(scores, labels)
    assert tau is not None
    assert tau >= 0.2
