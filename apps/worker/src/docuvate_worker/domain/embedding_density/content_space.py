# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Label content-space measures derived from NIW-Student-t posteriors."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from docuvate_worker.domain.embedding_density.niw import (
    NiwClassStats,
    NiwHyperparameters,
    class_marginal_log_density_components,
)


@dataclass(frozen=True)
class LabelContentMeasure:
    label_id: str
    prior_mass: float
    log_std_per_dim: float
    effective_rank: float
    overlap_top_partner: str | None
    overlap_mass: float


def _participation_ratio(cov: NDArray[np.float64]) -> float:
    tr = float(np.trace(cov))
    if tr <= 0:
        return 0.0
    fro2 = float(np.sum(cov * cov))
    if fro2 <= 0:
        return 0.0
    return (tr * tr) / fro2


def _log_std_per_dim(cov: NDArray[np.float64], global_cov: NDArray[np.float64]) -> float:
    sign_g, logdet_g = np.linalg.slogdet(global_cov + np.eye(global_cov.shape[0]) * 1e-8)
    sign_c, logdet_c = np.linalg.slogdet(cov + np.eye(cov.shape[0]) * 1e-8)
    if sign_g <= 0 or sign_c <= 0:
        return 0.0
    dim = cov.shape[0]
    return float((logdet_c - logdet_g) / (2.0 * dim))


def bhattacharyya_distance(
    mu_a: NDArray[np.float64],
    cov_a: NDArray[np.float64],
    mu_b: NDArray[np.float64],
    cov_b: NDArray[np.float64],
) -> float:
    cov = 0.5 * (cov_a + cov_b)
    diff = mu_a - mu_b
    try:
        inv = np.linalg.inv(cov + np.eye(cov.shape[0]) * 1e-8)
    except np.linalg.LinAlgError:
        return 0.0
    term1 = 0.125 * float(diff @ inv @ diff)
    sign, logdet = np.linalg.slogdet(cov + np.eye(cov.shape[0]) * 1e-8)
    sign_a, logdet_a = np.linalg.slogdet(cov_a + np.eye(cov_a.shape[0]) * 1e-8)
    sign_b, logdet_b = np.linalg.slogdet(cov_b + np.eye(cov_b.shape[0]) * 1e-8)
    if sign <= 0 or sign_a <= 0 or sign_b <= 0:
        return term1
    term2 = 0.5 * (logdet - 0.5 * (logdet_a + logdet_b))
    return float(term1 + term2)


def compute_label_content_measures(
    label_ids: list[str],
    stats_by_label: dict[str, NiwClassStats],
    hyper: NiwHyperparameters,
    priors: NDArray[np.float64],
) -> list[LabelContentMeasure]:
    dim = hyper.mu0.shape[0]
    mus: dict[str, NDArray[np.float64]] = {}
    covs: dict[str, NDArray[np.float64]] = {}
    for lid in label_ids:
        stats = stats_by_label.get(lid, NiwClassStats.empty(dim))
        mu, scale = class_marginal_log_density_components(stats, hyper)
        mus[lid] = mu
        covs[lid] = scale

    global_cov = np.zeros((dim, dim), dtype=np.float64)
    for i, lid in enumerate(label_ids):
        global_cov += priors[i] * covs[lid]
    global_cov += np.eye(dim) * 1e-8

    measures: list[LabelContentMeasure] = []
    for i, lid in enumerate(label_ids):
        cov = covs[lid]
        best_partner: str | None = None
        best_overlap = 0.0
        for other in label_ids:
            if other == lid:
                continue
            db = bhattacharyya_distance(mus[lid], cov, mus[other], covs[other])
            overlap = float(np.exp(-db))
            if overlap > best_overlap:
                best_overlap = overlap
                best_partner = other
        measures.append(
            LabelContentMeasure(
                label_id=lid,
                prior_mass=float(priors[i]),
                log_std_per_dim=_log_std_per_dim(cov, global_cov),
                effective_rank=_participation_ratio(cov),
                overlap_top_partner=best_partner,
                overlap_mass=best_overlap,
            )
        )
    return measures
