# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import numpy as np

from docuvate_worker.infrastructure.ml.docai.features import node_geom


def test_node_geom_handles_zero_height_box() -> None:
    document = {
        "w": 100.0,
        "h": 100.0,
        "units": [
            {"text": "a", "box": [0.0, 10.0, 20.0, 10.0]},
            {"text": "b", "box": [30.0, 10.0, 50.0, 20.0]},
        ],
    }
    geometry, rows = node_geom(document)
    assert geometry.shape == (2, 22)
    assert 0 in rows[0]
    assert 1 in rows[1]
