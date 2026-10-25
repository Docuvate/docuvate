# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import numpy as np

from docuvate_worker.domain.embedding_density.content_space import bhattacharyya_distance
from docuvate_worker.domain.embedding_density.model import EmbeddingDensityModel
from docuvate_worker.domain.embedding_density.niw import (
    NiwClassStats,
    class_log_predictive,
    default_hyperparameters,
)


def test_content_measures_with_extreme_log_priors() -> None:
    model = EmbeddingDensityModel(label_ids=["a", "b", "c"], dim=4)
    model.log_priors = {"a": 800.0, "b": 799.0, "c": -50.0}
    measures = model.content_measures()
    assert len(measures) == 3
    masses = [m.prior_mass for m in measures]
    assert all(m >= 0.0 for m in masses)
    assert abs(sum(masses) - 1.0) < 1e-6


def test_bhattacharyya_and_posterior_with_extreme_covariance() -> None:
    dim = 8
    mu_a = np.zeros(dim, dtype=np.float64)
    mu_b = np.ones(dim, dtype=np.float64) * 1e3
    cov_a = np.eye(dim, dtype=np.float64) * 1e-6
    cov_b = np.eye(dim, dtype=np.float64) * 1e6
    distance = bhattacharyya_distance(mu_a, cov_a, mu_b, cov_b)
    assert np.isfinite(distance)

    hyper = default_hyperparameters(dim)
    stats = NiwClassStats.empty(dim)
    vector = np.ones(dim, dtype=np.float64) * 1e2
    log_pdf = class_log_predictive(vector, stats, hyper)
    assert np.isfinite(log_pdf)


def test_posterior_with_many_blocks_simulated_logits() -> None:
    model = EmbeddingDensityModel(label_ids=["a", "b", "c", "d"], dim=4)
    vector = np.array([1e3, -1e3, 0.0, 1.0], dtype=np.float64)
    probs, log_px = model.posterior(vector)
    assert np.all(np.isfinite(probs))
    assert np.isfinite(log_px)
