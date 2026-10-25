# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Load RapidOCR via importlib so onnxruntime is not imported at module import time."""

from __future__ import annotations

import importlib
from typing import Any, Protocol

from docuvate_worker.infrastructure.extractors.rapidocr_protocol import (
    OcrImage,
    OcrResult,
    RapidOcrEngine,
)


class _RapidOcrInner(Protocol):
    def __call__(
        self,
        image: OcrImage,
        *,
        use_cls: bool = False,
    ) -> tuple[OcrResult, object]:
        ...


class _DelegatedRapidOcrEngine:
    def __init__(self, inner: _RapidOcrInner) -> None:
        self._inner = inner

    def __call__(
        self,
        image: OcrImage,
        *,
        use_cls: bool = False,
    ) -> tuple[OcrResult, object]:
        return self._inner(image, use_cls=use_cls)


def build_rapidocr_engine(**kwargs: Any) -> RapidOcrEngine:
    module = importlib.import_module("rapidocr_onnxruntime")
    rapid_ocr_cls = module.RapidOCR
    inner: _RapidOcrInner = rapid_ocr_cls(**kwargs)
    return _DelegatedRapidOcrEngine(inner)
