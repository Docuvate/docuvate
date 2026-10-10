# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import io
from typing import Any, Protocol, cast

from PIL import Image

from docuvate_worker.infrastructure.hardware_capabilities import heavy_vision_capable
from docuvate_worker.infrastructure.torch_device import (
    TorchDeviceKind,
    resolve_torch_inference_device,
    resolve_transformers_pipeline_device,
)

DONUT_MODEL = "naver-clova-ix/donut-base-finetuned-docvqa"

_pipeline: Any | None = None


def donut_available() -> bool:
    try:
        import transformers  # noqa: F401, PLC0415
    except ImportError:
        return False
    if not heavy_vision_capable():
        return False
    # DocVQA on CPU is unsupported for product chat (latency / prefill wall).
    return resolve_torch_inference_device() != "cpu"


def donut_inference_device() -> TorchDeviceKind:
    """Resolved torch device for Donut (for logs/smoke checks). Does not load the model."""
    return resolve_torch_inference_device()


class _DonutPipeline(Protocol):
    def __call__(self, *, image: object, question: str) -> object: ...


def _load_pipeline() -> _DonutPipeline:
    global _pipeline  # noqa: PLW0603
    if _pipeline is not None:
        return cast(_DonutPipeline, cast(object, _pipeline))
    from transformers import pipeline  # noqa: PLC0415

    _, device = resolve_transformers_pipeline_device()
    _pipeline = pipeline(
        task="document-question-answering",
        model=DONUT_MODEL,
        device=device,
    )
    return cast(_DonutPipeline, cast(object, _pipeline))


def _image_from_bytes(raw: bytes, mime_type: str) -> Image.Image:
    lowered = mime_type.lower()
    if lowered == "application/pdf" or raw[:4] == b"%PDF":
        from pdf2image import convert_from_bytes  # noqa: PLC0415

        pages = convert_from_bytes(raw, first_page=1, last_page=1, dpi=144)
        if not pages:
            raise ValueError("PDF enthält keine renderbare Seite")
        return pages[0]
    return Image.open(io.BytesIO(raw)).convert("RGB")


def answer_with_donut(raw: bytes, mime_type: str, question: str) -> str:
    if not donut_available():
        raise RuntimeError(
            "Donut DocVQA ist auf diesem System nicht verfügbar "
            "(GPU mit ausreichend VRAM erforderlich oder Paket nicht installiert). "
            "Bitte Ollama mit kleinem Modell oder CPU-RAG nutzen — siehe Einstellungen."
        )
    pipe = _load_pipeline()
    image = _image_from_bytes(raw, mime_type)
    result = pipe(image=image, question=question.strip())
    if isinstance(result, dict):
        answer = str(result.get("answer", "")).strip()
    elif isinstance(result, list) and result:
        first = result[0]
        answer = str(first.get("answer", "")).strip() if isinstance(first, dict) else str(first)
    else:
        answer = str(result).strip()
    if not answer:
        return "Donut konnte keine Antwort aus dem Seitenbild ableiten."
    return answer
