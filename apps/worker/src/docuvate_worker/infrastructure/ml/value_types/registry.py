# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from docuvate_worker.infrastructure.ml.value_types.model import ValueTypeModelBundle

_ARTIFACT_RELATIVE = Path("models") / "value_types_v1.json"


def worker_root() -> Path:
    return Path(__file__).resolve().parents[5]


def artifact_path() -> Path:
    return worker_root() / _ARTIFACT_RELATIVE


@lru_cache(maxsize=1)
def get_value_type_models() -> ValueTypeModelBundle:
    path = artifact_path()
    if not path.is_file():
        msg = f"learned value-type artifact missing: {path}"
        raise FileNotFoundError(msg)
    return ValueTypeModelBundle.load_json(path)
