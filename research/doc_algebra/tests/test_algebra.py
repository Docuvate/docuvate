"""Unit and property-based tests for D_B."""

from __future__ import annotations

import numpy as np
import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from algebra import (
    AlgebraElement,
    BilinearB,
    geometric_B_d2,
    learn_B_ridge,
    mul,
    one_element,
)


def test_one_element_is_identity():
    B = geometric_B_d2()
    d = 2
    m = B.m
    e = one_element(m, d)
    rng = np.random.default_rng(0)
    a = AlgebraElement(rng.normal(), rng.normal(size=d), rng.normal(size=m))
    b = AlgebraElement(rng.normal(), rng.normal(size=d), rng.normal(size=m))
    assert np.allclose(mul(a, e, B).a, a.a)
    assert np.allclose(mul(a, e, B).u, a.u)
    assert np.allclose(mul(a, e, B).t, a.t)
    assert np.allclose(mul(e, b, B).a, b.a)
    assert np.allclose(mul(e, b, B).u, b.u)
    assert np.allclose(mul(e, b, B).t, b.t)


@given(
    a=st.floats(-1e2, 1e2, allow_nan=False),
    b=st.floats(-1e2, 1e2, allow_nan=False),
    c=st.floats(-1e2, 1e2, allow_nan=False),
    u=st.lists(st.floats(-1e2, 1e2, allow_nan=False), min_size=2, max_size=2),
    v=st.lists(st.floats(-1e2, 1e2, allow_nan=False), min_size=2, max_size=2),
    w=st.lists(st.floats(-1e2, 1e2, allow_nan=False), min_size=2, max_size=2),
)
@settings(max_examples=80, deadline=None)
def test_associativity_random_B(a, b, c, u, v, w):
    rng = np.random.default_rng(1)
    mats = rng.normal(size=(2, 2, 2))
    B = BilinearB(mats)
    m = B.m
    t1 = rng.normal(size=m)
    t2 = rng.normal(size=m)
    t3 = rng.normal(size=m)
    x = AlgebraElement(a, np.array(u), t1)
    y = AlgebraElement(b, np.array(v), t2)
    z = AlgebraElement(c, np.array(w), t3)
    left = mul(mul(x, y, B), z, B)
    right = mul(x, mul(y, z, B), B)
    assert np.allclose(left.a, right.a, rtol=1e-9, atol=1e-9)
    assert np.allclose(left.u, right.u, rtol=1e-9, atol=1e-9)
    assert np.allclose(left.t, right.t, rtol=1e-9, atol=1e-9)


def test_distributivity_scalar():
    B = geometric_B_d2()
    rng = np.random.default_rng(2)
    x = AlgebraElement(1.0, rng.normal(size=2), rng.normal(size=2))
    y = AlgebraElement(2.0, rng.normal(size=2), rng.normal(size=2))
    z = AlgebraElement(-1.0, rng.normal(size=2), rng.normal(size=2))
    left = mul(x, AlgebraElement(y.a + z.a, y.u + z.u, y.t + z.t), B)
    right_a = mul(x, y, B)
    right_b = mul(x, z, B)
    assert np.allclose(left.a, right_a.a + right_b.a)
    assert np.allclose(left.u, right_a.u + right_b.u)
    assert np.allclose(left.t, right_a.t + right_b.t)


def test_learned_B_still_associative():
    rng = np.random.default_rng(3)
    pairs = rng.normal(size=(40, 2, 2))
    targets = rng.normal(size=(40, 2))
    B, diag = learn_B_ridge(pairs, targets, reg=1e-2)
    assert diag["cond_XtX_reg"] < 1e12
    e1 = AlgebraElement(1.0, rng.normal(size=2), np.zeros(2))
    e2 = AlgebraElement(0.7, rng.normal(size=2), rng.normal(size=2))
    e3 = AlgebraElement(-0.3, rng.normal(size=2), rng.normal(size=2))
    assert np.allclose(mul(mul(e1, e2, B), e3, B).t, mul(e1, mul(e2, e3, B), B).t, atol=1e-8)


def test_geometric_B_commutative_first_not_second():
    B = geometric_B_d2()
    u = np.array([1.0, 0.0])
    v = np.array([0.0, 1.0])
    s = B.evaluate(u, v)
    assert np.isclose(s[0], s[0])  # dot symmetric
    assert np.isclose(s[0], B.evaluate(v, u)[0])
    assert not np.isclose(s[1], B.evaluate(v, u)[1])
