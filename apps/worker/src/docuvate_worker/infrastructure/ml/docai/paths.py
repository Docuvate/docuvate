# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

_DOCAI_MODEL_ROOT = (
    Path(__file__).resolve().parents[5] / "models" / "docai_v0_3" / "model"
)
_NER_MODEL = Path(__file__).resolve().parents[5] / "models" / "ner_doc.int8.onnx"


@lru_cache(maxsize=1)
def docai_model_dir() -> Path:
    return _DOCAI_MODEL_ROOT


@lru_cache(maxsize=1)
def ner_doc_model_path() -> Path:
    return _NER_MODEL
