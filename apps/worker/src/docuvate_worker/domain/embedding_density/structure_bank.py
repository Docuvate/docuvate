# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Structure-bank covariance prior for cold-start classes (paper def-bank)."""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from numpy.typing import NDArray

from docuvate_worker.domain.embedding_density.niw import (
    NiwClassStats,
    class_log_predictive,
    default_hyperparameters,
)


def _empty_prototype_list() -> list[NDArray[np.float64]]:
    return []


def _covariance_from_vectors(vectors: NDArray[np.float64]) -> NDArray[np.float64]:
    if vectors.shape[0] < 2:
        return np.eye(vectors.shape[1], dtype=np.float64)
    centered = vectors - np.mean(vectors, axis=0)
    cov = centered.T @ centered / max(vectors.shape[0] - 1, 1)
    out = 0.5 * (cov + cov.T) + np.eye(vectors.shape[1]) * 1e-6
    return np.asarray(out, dtype=np.float64)


def _scatter_from_stats(stats: NiwClassStats) -> NDArray[np.float64]:
    if stats.count == 0:
        return np.zeros_like(stats.sum_xx)
    mean = stats.sum_x / stats.count
    return stats.sum_xx - stats.count * np.outer(mean, mean)


@dataclass
class StructureBank:
    """Unlabeled prototype directions; covariance prior for new labels."""

    prototypes: list[NDArray[np.float64]] = field(default_factory=_empty_prototype_list)

    def add_prototype(self, vector: NDArray[np.float64]) -> None:
        self.prototypes.append(np.asarray(vector, dtype=np.float64).reshape(-1))

    def sigma_bank(self, dim: int) -> NDArray[np.float64]:
        if not self.prototypes:
            return np.eye(dim, dtype=np.float64)
        arr = np.stack(self.prototypes, axis=0)
        return _covariance_from_vectors(arr)

    def _loo_lambda(
        self,
        exemplar_stats: NiwClassStats,
        other_stats: dict[str, NiwClassStats],
        dim: int,
    ) -> float:
        if not other_stats or exemplar_stats.count == 0:
            return 1.0
        hyper = default_hyperparameters(dim)
        candidates = (0.0, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0)
        best_lambda = 1.0
        best_score = float("-inf")
        sigma_bank = self.sigma_bank(dim)
        hat_scatter = _scatter_from_stats(exemplar_stats)
        for lam in candidates:
            score = 0.0
            count = 0
            for stats in other_stats.values():
                if stats.count == 0:
                    continue
                mean = stats.sum_x / stats.count
                score += class_log_predictive(mean, stats, hyper)
                count += 1
            prior_stats = NiwClassStats.empty(dim)
            prior_stats.count = exemplar_stats.count
            prior_stats.sum_x = exemplar_stats.sum_x.copy()
            prior_scatter = hat_scatter + lam * sigma_bank
            mean = exemplar_stats.sum_x / max(exemplar_stats.count, 1)
            prior_stats.sum_xx = prior_scatter + exemplar_stats.count * np.outer(mean, mean)
            for stats in other_stats.values():
                if stats.count == 0:
                    continue
                mean_o = stats.sum_x / stats.count
                score += class_log_predictive(mean_o, prior_stats, hyper)
                count += 1
            if count > 0 and score > best_score:
                best_score = score
                best_lambda = lam
        return best_lambda

    def prior_stats_for_new_class(
        self,
        exemplars: list[NDArray[np.float64]],
        dim: int,
        *,
        other_class_stats: dict[str, NiwClassStats] | None = None,
    ) -> NiwClassStats:
        stats = NiwClassStats.empty(dim)
        for ex in exemplars:
            stats.add(ex)
        if stats.count == 0:
            return stats
        lam = self._loo_lambda(stats, other_class_stats or {}, dim)
        if lam <= 0.0 or not self.prototypes:
            return stats
        sigma_bank = self.sigma_bank(dim)
        hat_scatter = _scatter_from_stats(stats)
        mean = stats.sum_x / stats.count
        prior_scatter = hat_scatter + lam * sigma_bank
        out = NiwClassStats.empty(dim)
        for ex in exemplars:
            out.add(ex)
        out.sum_xx = prior_scatter + out.count * np.outer(mean, mean)
        return out

    @staticmethod
    def build_from_unlabeled(
        vectors: list[NDArray[np.float64]],
        max_prototypes: int = 32,
    ) -> StructureBank:
        bank = StructureBank()
        if not vectors:
            return bank
        stacked = np.stack([np.asarray(v, dtype=np.float64).reshape(-1) for v in vectors], axis=0)
        arr: NDArray[np.float64] = np.asarray(stacked, dtype=np.float64)
        if arr.shape[0] <= max_prototypes:
            for row in arr:
                bank.add_prototype(row)
            return bank
        chosen: list[int] = [0]
        while len(chosen) < max_prototypes:
            dists: list[tuple[float, int]] = []
            for i in range(arr.shape[0]):
                if i in chosen:
                    continue
                d = min(
                    float(np.linalg.norm(arr[i, :] - arr[j, :], ord=2))
                    for j in chosen
                )
                dists.append((d, i))
            if not dists:
                break
            chosen.append(max(dists, key=lambda pair: pair[0])[1])
        for idx in chosen:
            bank.add_prototype(arr[idx])
        return bank
