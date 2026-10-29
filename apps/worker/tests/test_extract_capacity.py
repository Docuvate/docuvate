# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import http

from fastapi.testclient import TestClient

from docuvate_worker.main import app


def test_health_capacity_reports_slots() -> None:
    client = TestClient(app)
    response = client.get("/v1/health/capacity")
    assert response.status_code == http.HTTPStatus.OK
    body = response.json()
    assert body["recommendedConcurrentExtractions"] >= 1
    assert body["extractSlotsFree"] >= 0
    assert body["activeExtractJobs"] >= 0
