# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Contract test: the API adapter fixture must be accepted by the worker route."""

from __future__ import annotations

import os
from http import HTTPStatus
from pathlib import Path

from fastapi.testclient import TestClient
from pydantic import BaseModel, ConfigDict, Field

from docuvate_worker.main import app

_FIXTURE = Path(__file__).parent / "fixtures" / "smart_duplicates_detect_contract.v1.json"


class _ContractFixture(BaseModel):
    path: str
    request: dict[str, object]
    expected_document_ids: list[str] = Field(validation_alias="expectedDocumentIds")


class _ApiCandidate(BaseModel):
    """Mirrors the zod schema in the API's HttpSmartDuplicatesAdapter."""

    model_config = ConfigDict(extra="forbid")
    document_id: str = Field(validation_alias="documentId")
    similarity: float


class _ApiResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    candidates: list[_ApiCandidate]


def test_detect_route_accepts_api_adapter_payload() -> None:
    fixture = _ContractFixture.model_validate_json(_FIXTURE.read_text(encoding="utf-8"))
    secret = os.environ.get("WORKER_SECRET", "worker-shared-secret")
    response = TestClient(app).post(
        f"/v1{fixture.path}",
        headers={"X-Worker-Secret": secret},
        json=fixture.request,
    )
    assert response.status_code == HTTPStatus.OK
    payload = _ApiResponse.model_validate_json(response.text)
    assert [row.document_id for row in payload.candidates] == fixture.expected_document_ids


def test_detect_route_requires_worker_secret() -> None:
    fixture = _ContractFixture.model_validate_json(_FIXTURE.read_text(encoding="utf-8"))
    response = TestClient(app).post(f"/v1{fixture.path}", json=fixture.request)
    assert response.status_code == HTTPStatus.UNAUTHORIZED
