# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Per-organization Gaussian kernel log-odds corrections with Tikhonov regulariser."""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from numpy.typing import NDArray

KERNEL_REGULARIZER_LAMBDA = 1e-3
CORRECTION_MARGIN_KAPPA = 1.0


def _empty_vector_list() -> list[NDArray[np.float64]]:
    return []


def _empty_org_list() -> list[str]:
    return []


def rbf_kernel(x: NDArray[np.float64], y: NDArray[np.float64], bandwidth: float) -> float:
    diff = np.asarray(x, dtype=np.float64) - np.asarray(y, dtype=np.float64)
    h2 = max(bandwidth * bandwidth, 1e-12)
    return float(np.exp(-0.5 * float(np.dot(diff, diff)) / h2))


def correction_log_odds_targets(
    log_odds: NDArray[np.float64],
    target_index: int,
    *,
    kappa: float = CORRECTION_MARGIN_KAPPA,
) -> NDArray[np.float64]:
    """Paper def-feedback: raise target by delta_j, clamp labels above the margin floor."""
    log_odds = np.asarray(log_odds, dtype=np.float64).reshape(-1)
    pred_index = int(np.argmax(log_odds))
    l_p = float(log_odds[pred_index])
    l_y = float(log_odds[target_index])
    delta_j = (l_p - l_y + kappa) / 2.0
    floor = l_y + delta_j - kappa
    targets = np.zeros(log_odds.shape[0], dtype=np.float64)
    for i in range(log_odds.shape[0]):
        if i == target_index:
            targets[i] = delta_j
        elif float(log_odds[i]) > floor:
            targets[i] = floor - float(log_odds[i])
    return targets


@dataclass
class KernelCorrector:
    bandwidth: float = 0.5
    regularizer: float = KERNEL_REGULARIZER_LAMBDA
    cross_org_strength: float = 0.0
    points: list[NDArray[np.float64]] = field(default_factory=_empty_vector_list)
    label_offsets: list[NDArray[np.float64]] = field(default_factory=_empty_vector_list)
    point_organization_ids: list[str] = field(default_factory=_empty_org_list)
    gram_inverse: NDArray[np.float64] | None = None

    def _gram_matrix(self) -> NDArray[np.float64]:
        n = len(self.points)
        k = np.zeros((n, n), dtype=np.float64)
        for i in range(n):
            k[i, i] = 1.0
            for j in range(i + 1, n):
                val = rbf_kernel(self.points[i], self.points[j], self.bandwidth)
                k[i, j] = val
                k[j, i] = val
        lam = self.regularizer
        if n > 0:
            k += lam * np.eye(n, dtype=np.float64)
        return k

    def _ensure_inverse(self) -> NDArray[np.float64]:
        if self.gram_inverse is not None and self.gram_inverse.shape[0] == len(self.points):
            return self.gram_inverse
        n = len(self.points)
        if n == 0:
            self.gram_inverse = np.zeros((0, 0), dtype=np.float64)
            return self.gram_inverse
        self.gram_inverse = np.linalg.inv(self._gram_matrix())
        return self.gram_inverse

    def add_correction(
        self,
        point: NDArray[np.float64],
        offsets: NDArray[np.float64],
        *,
        organization_id: str = "default",
    ) -> None:
        """Append a correction; Schur update for (K + lambda I)^{-1}."""
        point = np.asarray(point, dtype=np.float64).reshape(-1)
        offsets = np.asarray(offsets, dtype=np.float64).reshape(-1)
        lam = self.regularizer
        n = len(self.points)
        if n == 0:
            self.points.append(point)
            self.label_offsets.append(offsets)
            self.point_organization_ids.append(organization_id)
            self.gram_inverse = np.array([[1.0 / (1.0 + lam)]], dtype=np.float64)
            return

        inv = self._ensure_inverse()
        k_vec = np.array(
            [rbf_kernel(point, self.points[i], self.bandwidth) for i in range(n)],
            dtype=np.float64,
        )
        schur = (1.0 + lam) - float(k_vec @ inv @ k_vec)
        if abs(schur) < 1e-12:  # noqa: PLR2004
            schur = 1e-12
        inv_new = np.zeros((n + 1, n + 1), dtype=np.float64)
        inv_new[:n, :n] = inv + (inv @ np.outer(k_vec, k_vec) @ inv) / schur
        inv_new[:n, n] = -(inv @ k_vec) / schur
        inv_new[n, :n] = inv_new[:n, n]
        inv_new[n, n] = 1.0 / schur

        self.points.append(point)
        self.label_offsets.append(offsets)
        self.point_organization_ids.append(organization_id)
        self.gram_inverse = inv_new

    def log_odds_delta(
        self,
        x: NDArray[np.float64],
        num_labels: int,
        *,
        organization_id: str = "default",
    ) -> NDArray[np.float64]:
        if not self.points:
            return np.zeros(num_labels, dtype=np.float64)
        n = len(self.points)
        k_vec = np.array(
            [rbf_kernel(x, self.points[i], self.bandwidth) for i in range(n)],
            dtype=np.float64,
        )
        inv = self._ensure_inverse()
        weights = inv @ k_vec
        delta = np.zeros(num_labels, dtype=np.float64)
        for i in range(n):
            offsets = self.label_offsets[i]
            if offsets.shape[0] != num_labels:
                continue
            org_scale = (
                1.0
                if self.point_organization_ids[i] == organization_id
                else self.cross_org_strength
            )
            delta += org_scale * weights[i] * offsets
        return delta
