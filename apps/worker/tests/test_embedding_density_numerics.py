# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import numpy as np

from docuvate_worker.domain.embedding_density.model import EmbeddingDensityModel


def test_content_measures_with_extreme_log_priors() -> None:
    model = EmbeddingDensityModel(label_ids=["a", "b", "c"], dim=4)
    model.log_priors = {"a": 800.0, "b": 799.0, "c": -50.0}
    measures = model.content_measures()
    assert len(measures) == 3
    masses = [m.prior_mass for m in measures]
    assert all(m >= 0.0 for m in masses)
    assert abs(sum(masses) - 1.0) < 1e-6
