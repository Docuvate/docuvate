from __future__ import annotations

import numpy as np
from hypothesis import given, settings
from hypothesis import strategies as st

from tensor_algebra import encode_position, mul_trunc, zero


@given(
    x=st.floats(-2, 2, allow_nan=False),
    y=st.floats(-2, 2, allow_nan=False),
    z=st.floats(-2, 2, allow_nan=False),
)
@settings(max_examples=50, deadline=None)
def test_truncated_associativity(x, y, z):
    d = 2
    a = encode_position(x, y, d)
    b = encode_position(y, z, d)
    c = encode_position(z, x, d)
    left = mul_trunc(mul_trunc(a, b, d), c, d)
    right = mul_trunc(a, mul_trunc(b, c, d), d)
    assert np.allclose(left.to_vector(d), right.to_vector(d), rtol=1e-9, atol=1e-9)


def test_zero_is_annihilator_in_degree1():
    d = 2
    z = zero(d)
    p = encode_position(0.3, 0.4, d)
    prod = mul_trunc(z, p, d)
    assert prod.g0 == 0.0
