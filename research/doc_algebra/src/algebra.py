"""
Associative algebra family D_B.

Elements d = (a, u, t) with a in R, u in R^d, t in R^m.
Bilinear maps B_k: R^d x R^d -> R for k=1..m (stacked as t-components).

Product (a,u,t) * (b,v,s) = (ab, a v + b u, a s + b t + B(u,v))
where B(u,v)_k = u^T B_k v.

Associativity holds for ANY bilinear B (fixed or learned): the algebra is the
standard associative extension / semidirect product with quadratic tail B(u,v).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence

import numpy as np


@dataclass(frozen=True)
class AlgebraElement:
    """Element of D_B: scalar a, vector u, tail t in R^m."""

    a: float
    u: np.ndarray
    t: np.ndarray

    def __post_init__(self) -> None:
        object.__setattr__(self, "u", np.asarray(self.u, dtype=np.float64))
        object.__setattr__(self, "t", np.asarray(self.t, dtype=np.float64))


@dataclass
class BilinearB:
    """
    Stack of m symmetric-ish bilinear forms B_k, each d x d.
    B(u,v)_k = u @ B_k @ v
    """

    matrices: np.ndarray  # shape (m, d, d)

    @property
    def m(self) -> int:
        return int(self.matrices.shape[0])

    @property
    def d(self) -> int:
        return int(self.matrices.shape[1])

    def evaluate(self, u: np.ndarray, v: np.ndarray) -> np.ndarray:
        u = np.asarray(u, dtype=np.float64).reshape(-1)
        v = np.asarray(v, dtype=np.float64).reshape(-1)
        return np.einsum("kij,i,j->k", self.matrices, u, v)

    @classmethod
    def from_learned_flat(cls, flat: np.ndarray, d: int) -> BilinearB:
        """flat encodes vec(B_k) row-major for each k."""
        flat = np.asarray(flat, dtype=np.float64).reshape(-1)
        m = flat.size // (d * d)
        mats = flat.reshape(m, d, d)
        return cls(matrices=mats)


def geometric_B_d2() -> BilinearB:
    """
    u = (x, y); B(u,v) = [dot(u,v), u_x v_y - u_y v_x] (length m=2).
    Second component is the 2D scalar cross / oriented area pairing.
    """
    dot = np.eye(2, dtype=np.float64)
    skew = np.array([[0.0, 1.0], [-1.0, 0.0]], dtype=np.float64)
    return BilinearB(matrices=np.stack([dot, skew], axis=0))


def one_element(m: int, d: int) -> AlgebraElement:
    return AlgebraElement(a=1.0, u=np.zeros(d), t=np.zeros(m))


def zero_element(m: int, d: int) -> AlgebraElement:
    return AlgebraElement(a=0.0, u=np.zeros(d), t=np.zeros(m))


def mul(
    left: AlgebraElement,
    right: AlgebraElement,
    B: BilinearB,
) -> AlgebraElement:
    a, u, t = left.a, left.u, left.t
    b, v, s = right.a, right.u, right.t
    if u.shape[0] != B.d or v.shape[0] != B.d:
        raise ValueError("Dimension mismatch")
    if t.shape[0] != B.m or s.shape[0] != B.m:
        raise ValueError("Tail dimension mismatch")
    B_uv = B.evaluate(u, v)
    return AlgebraElement(
        a=a * b,
        u=a * v + b * u,
        t=a * s + b * t + B_uv,
    )


def is_commutative(B: BilinearB, trials: int = 50, rng: np.random.Generator | None = None) -> bool:
    rng = rng or np.random.default_rng(0)
    d, m = B.d, B.m
    for _ in range(trials):
        u = rng.normal(size=d)
        v = rng.normal(size=d)
        if not np.allclose(B.evaluate(u, v), B.evaluate(v, u)):
            return False
    return True


def nilpotent_u_part(B: BilinearB, max_power: int = 4) -> int | None:
    """
    For pure vector elements (0,u,0), check if u-part vanishes under repeated product.
    Returns nilpotency index if found, else None.
    """
    d, m = B.d, B.m
    rng = np.random.default_rng(1)
    u = rng.normal(size=d)
    e = AlgebraElement(0.0, u, np.zeros(m))
    cur = e
    for k in range(2, max_power + 1):
        cur = mul(cur, e, B)
        if np.linalg.norm(cur.u) < 1e-10 and abs(cur.a) < 1e-10:
            return k
    return None


def learn_B_ridge(
    pairs_uv: np.ndarray,
    targets: np.ndarray,
    reg: float = 1e-3,
) -> tuple[BilinearB, dict]:
    """
    Learn each B_k via Ridge on vec(u v^T).
    pairs_uv: (N, 2, d), targets: (N, m)
    Returns B and diagnostics (condition numbers, etc.).
    """
    pairs_uv = np.asarray(pairs_uv, dtype=np.float64)
    targets = np.asarray(targets, dtype=np.float64)
    n, _, d = pairs_uv.shape
    m = targets.shape[1]
    design = np.zeros((n, d * d))
    for i in range(n):
        u, v = pairs_uv[i, 0], pairs_uv[i, 1]
        design[i] = np.outer(u, v).ravel()
    # Exact normal equations: (X^T X + λI) w = X^T y
    xtx = design.T @ design
    xty = design.T @ targets
    reg_i = reg * np.eye(d * d)
    cond = float(np.linalg.cond(xtx + reg_i))
    weights = np.linalg.solve(xtx + reg_i, xty)  # (d*d, m)
    flat = weights.T.ravel()
    B = BilinearB.from_learned_flat(flat, d)
    ram_bytes = design.nbytes + xtx.nbytes
    diag = {
        "n_pairs": n,
        "d": d,
        "m": m,
        "reg": reg,
        "cond_XtX_reg": cond,
        "train_mse": float(np.mean((design @ weights - targets) ** 2)),
        "design_ram_bytes": ram_bytes,
        "fit_complexity": f"O(n d^4 + d^6) naive; here n={n}, d={d}",
    }
    return B, diag


def algebra_element_from_coords(
    x: float,
    y: float,
    a: float = 1.0,
    extra_tail: Sequence[float] | None = None,
    B: BilinearB | None = None,
) -> AlgebraElement:
    B = B or geometric_B_d2()
    t = np.zeros(B.m)
    if extra_tail is not None:
        t[: len(extra_tail)] = extra_tail
    return AlgebraElement(a=a, u=np.array([x, y], dtype=np.float64), t=t)


def translate_u(elem: AlgebraElement, dx: float, dy: float) -> AlgebraElement:
    u = elem.u + np.array([dx, dy])
    return AlgebraElement(elem.a, u, elem.t.copy())


def scale_u(elem: AlgebraElement, s: float) -> AlgebraElement:
    return AlgebraElement(elem.a, s * elem.u, elem.t.copy())


def rotate_u(elem: AlgebraElement, theta: float) -> AlgebraElement:
    c, sn = np.cos(theta), np.sin(theta)
    R = np.array([[c, -sn], [sn, c]])
    return AlgebraElement(elem.a, R @ elem.u, elem.t.copy())
