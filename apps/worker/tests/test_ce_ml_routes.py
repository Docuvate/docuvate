# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

from docuvate_worker.main import app

pytestmark = pytest.mark.skipif(
    os.environ.get("RUN_CE_ML_INTEGRATION") != "1",
    reason="set RUN_CE_ML_INTEGRATION=1 to run CE ML worker route integration test",
)


def test_label_propagation_route() -> None:
    client = TestClient(app)
    secret = os.environ.get("WORKER_SECRET", "worker-shared-secret")
    response = client.post(
        "/v1/ml/ce/label-propagation",
        headers={"X-Worker-Secret": secret},
        json={
            "label_name": "Rechnung",
            "passage_vectors": [[1.0, 0.0], [0.9, 0.1], [0.0, 1.0]],
            "seed_document_indices": [0],
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["scores"]) == 2
