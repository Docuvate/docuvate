# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import numpy as np

from docuvate_worker.infrastructure.ml.docai import features as layout_features


def test_nbr_feats_requires_rows_on_payload() -> None:
    units = [{"text": "Invoice", "box": [0.0, 0.0, 0.2, 0.1]}]
    payload: layout_features.LayoutDocument = {
        "w": 1.0,
        "h": 1.0,
        "units": units,
        "E": np.ones((1, 4), dtype=np.float32),
    }
    geometry, rows = layout_features.node_geom(payload)
    payload["G"] = geometry
    payload["rows"] = rows
    probabilities = np.array([[0.2, 0.8]], dtype=np.float32)
    features = layout_features.nbr_feats(payload, probabilities, {})
    assert features.shape[0] == 1
