# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import os


def mlops_registry_enabled() -> bool:
    raw = os.environ.get("MLOPS_REGISTRY_ENABLED", "false").strip().lower()
    return raw in ("1", "true", "yes")


def mlflow_tracking_uri() -> str | None:
    uri = os.environ.get("MLFLOW_TRACKING_URI", "").strip()
    return uri or None


def mlops_canary_required_metric() -> str:
    return os.environ.get("MLOPS_CANARY_REQUIRED_METRIC", "field_f1").strip() or "field_f1"
