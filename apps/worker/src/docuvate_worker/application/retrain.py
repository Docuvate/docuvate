# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Background retrain stub — no GPU training; produces synthetic metrics for pipeline wiring."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime

from docuvate_worker.infrastructure.ml.config import (
    mlflow_tracking_uri,
    mlops_canary_required_metric,
)


@dataclass(frozen=True)
class RetrainStubResult:
    version_tag: str
    metrics: dict[str, float]
    row_count: int
    dataset_version: str
    artifact_uri: str | None
    external_run_id: str | None
    notes: str


def run_retrain_stub(*, job_id: str, family_id: str, correction_count: int) -> RetrainStubResult:
    now = datetime.now(tz=UTC)
    version_tag = f"stub-{now.strftime('%Y%m%dT%H%M%S')}-{job_id[:8]}"
    metric_key = mlops_canary_required_metric()

    # Stub: pretend retrain always slightly improves the required canary metric.
    base = 0.66 if family_id == "heuristic-fields" else 0.7
    bump = min(0.08, correction_count / 5000)
    metrics = {metric_key: round(base + bump, 4)}
    if family_id == "paddle-ocr":
        metrics["ocr_cer"] = round(max(0.03, 0.08 - bump / 2), 4)
    if family_id == "fastembed-minilm":
        metrics["embedding_recall_at_10"] = round(0.82 + bump, 4)

    tracking = mlflow_tracking_uri()
    external_run_id = f"stub-{uuid.uuid4()}" if tracking else None
    notes = (
        "Stub retrain — no weights written. "
        f"MLFLOW_TRACKING_URI={'set' if tracking else 'unset'}."
    )

    return RetrainStubResult(
        version_tag=version_tag,
        metrics=metrics,
        row_count=correction_count,
        dataset_version=now.isoformat(),
        artifact_uri=None,
        external_run_id=external_run_id,
        notes=notes,
    )
