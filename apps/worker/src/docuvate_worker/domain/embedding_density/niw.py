# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Normal-inverse-Wishart conjugate updates and Student-t predictive densities."""

from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray


@dataclass
class NiwHyperparameters:
    kappa0: float
    nu0: float
    mu0: NDArray[np.float64]
    psi0: NDArray[np.float64]


@dataclass
class NiwClassStats:
    count: int
    sum_x: NDArray[np.float64]
    sum_xx: NDArray[np.float64]

    @classmethod
    def empty(cls, dim: int) -> NiwClassStats:
        return cls(
            count=0,
            sum_x=np.zeros(dim, dtype=np.float64),
            sum_xx=np.zeros((dim, dim), dtype=np.float64),
        )

    def add(self, x: NDArray[np.float64]) -> None:
        x = np.asarray(x, dtype=np.float64).reshape(-1)
        self.count += 1
        self.sum_x += x
        self.sum_xx += np.outer(x, x)

    def merge(self, other: NiwClassStats) -> None:
        self.count += other.count
        self.sum_x += other.sum_x
        self.sum_xx += other.sum_xx


def default_hyperparameters(
    dim: int,
    *,
    kappa0: float = 1.0,
    nu0: float | None = None,
) -> NiwHyperparameters:
    nu = float(nu0 if nu0 is not None else dim + 50)
    mu0 = np.zeros(dim, dtype=np.float64)
    psi0 = np.eye(dim, dtype=np.float64)
    return NiwHyperparameters(kappa0=kappa0, nu0=nu, mu0=mu0, psi0=psi0)


def _posterior_params(
    stats: NiwClassStats,
    hyper: NiwHyperparameters,
) -> tuple[float, float, NDArray[np.float64], NDArray[np.float64]]:
    n = stats.count
    if n == 0:
        return hyper.kappa0, hyper.nu0, hyper.mu0.copy(), hyper.psi0.copy()

    xbar = stats.sum_x / n
    scatter = stats.sum_xx - n * np.outer(xbar, xbar)
    scatter = 0.5 * (scatter + scatter.T)

    kappa_n = hyper.kappa0 + n
    nu_n = hyper.nu0 + n
    mu_n = (hyper.kappa0 * hyper.mu0 + n * xbar) / kappa_n
    diff = xbar - hyper.mu0
    psi_n = hyper.psi0 + scatter + (hyper.kappa0 * n / kappa_n) * np.outer(diff, diff)
    psi_n = 0.5 * (psi_n + psi_n.T)
    return kappa_n, nu_n, mu_n, psi_n


def _student_t_scale_matrix(
    kappa_n: float,
    nu_n: float,
    psi_n: NDArray[np.float64],
    dim: int,
) -> tuple[float, NDArray[np.float64]]:
    nu_pred = max(nu_n - dim + 1.0, 2.1)
    scale = ((kappa_n + 1.0) / (kappa_n * nu_pred)) * psi_n
    scale = 0.5 * (scale + scale.T)
    return nu_pred, scale


def log_student_t_pdf(
    x: NDArray[np.float64],
    mu: NDArray[np.float64],
    scale: NDArray[np.float64],
    nu: float,
) -> float:
    x = np.asarray(x, dtype=np.float64).reshape(-1)
    mu = np.asarray(mu, dtype=np.float64).reshape(-1)
    dim = x.shape[0]
    delta = x - mu
    try:
        chol = np.linalg.cholesky(scale)
    except np.linalg.LinAlgError:
        scale = scale + np.eye(dim) * 1e-6
        chol = np.linalg.cholesky(scale)
    sol = np.linalg.solve(chol, delta)
    quad = float(np.dot(sol, sol))
    log_det = 2.0 * float(np.sum(np.log(np.diag(chol))))
    log_norm = (
        math.lgamma((nu + dim) / 2.0)
        - math.lgamma(nu / 2.0)
        - 0.5 * dim * math.log(nu * math.pi)
        - 0.5 * log_det
    )
    return float(log_norm - 0.5 * (nu + dim) * np.log1p(quad / nu))


def class_log_predictive(
    x: NDArray[np.float64],
    stats: NiwClassStats,
    hyper: NiwHyperparameters,
) -> float:
    dim = hyper.mu0.shape[0]
    kappa_n, nu_n, mu_n, psi_n = _posterior_params(stats, hyper)
    nu_pred, scale = _student_t_scale_matrix(kappa_n, nu_n, psi_n, dim)
    return log_student_t_pdf(x, mu_n, scale, nu_pred)


def class_marginal_log_density_components(
    stats: NiwClassStats,
    hyper: NiwHyperparameters,
) -> tuple[NDArray[np.float64], NDArray[np.float64]]:
    """Return posterior mean and scale for content-space overlap metrics."""
    dim = hyper.mu0.shape[0]
    kappa_n, nu_n, mu_n, psi_n = _posterior_params(stats, hyper)
    _nu_pred, scale = _student_t_scale_matrix(kappa_n, nu_n, psi_n, dim)
    return mu_n, scale
