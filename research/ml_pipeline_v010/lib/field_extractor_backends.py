# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""GLiNER2 / GLiNER2.5 extractors with span confidence for unified benchmarks."""

from __future__ import annotations

import gc
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, Sequence

ExtractorId = Literal[
    "gliner2-base-v1",
    "gliner2.5-small-v1",
    "gliner2.5-base-v1",
    "gliner2.5-multi-v1",
]

CACHE_DIR = Path(__file__).resolve().parents[2] / "extraction_baseline" / ".cache" / "huggingface"

MODEL_SPECS: dict[ExtractorId, dict[str, str]] = {
    "gliner2-base-v1": {
        "model_id": "fastino/gliner2-base-v1",
        "hf_revision": "f9634218e53580c56edf0de97ca1a7d3f1c2354e",
        "license": "Apache-2.0",
        "loader": "GLiNER2",
    },
    "gliner2.5-small-v1": {
        "model_id": "fastino/gliner2.5-small-v1",
        "hf_revision": "",
        "license": "Apache-2.0",
        "loader": "AutoExtractor",
    },
    "gliner2.5-base-v1": {
        "model_id": "fastino/gliner2.5-base-v1",
        "hf_revision": "",
        "license": "Apache-2.0",
        "loader": "AutoExtractor",
    },
    "gliner2.5-multi-v1": {
        "model_id": "fastino/gliner2.5-multi-v1",
        "hf_revision": "",
        "license": "Apache-2.0",
        "loader": "AutoExtractor",
    },
}


@dataclass(frozen=True)
class SpanPrediction:
    key: str
    value: str
    confidence: float | None
    start: int | None = None
    end: int | None = None


_models: dict[ExtractorId, object] = {}


def unload_all_models() -> None:
    _models.clear()
    gc.collect()
    try:
        import torch

        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    except ImportError:
        pass


def load_extractor(extractor_id: ExtractorId):
    if extractor_id in _models:
        return _models[extractor_id]
    spec = MODEL_SPECS[extractor_id]
    model_id = spec["model_id"]
    if spec["loader"] == "GLiNER2":
        from gliner2 import GLiNER2

        model = GLiNER2.from_pretrained(model_id, cache_dir=str(CACHE_DIR))
    else:
        from gliner2 import AutoExtractor

        model = AutoExtractor.from_pretrained(model_id, cache_dir=str(CACHE_DIR))
    _models[extractor_id] = model
    return model


def _parse_entity_spans(key: str, spans: object) -> list[SpanPrediction]:
    out: list[SpanPrediction] = []
    if not isinstance(spans, list):
        return out
    for span in spans:
        if isinstance(span, dict):
            text = str(span.get("text", "")).strip()
            if not text:
                continue
            conf_raw = span.get("confidence")
            conf = float(conf_raw) if conf_raw is not None else None
            start = span.get("start")
            end = span.get("end")
            out.append(
                SpanPrediction(
                    key=key,
                    value=text,
                    confidence=conf,
                    start=int(start) if start is not None else None,
                    end=int(end) if end is not None else None,
                )
            )
        elif isinstance(span, str) and span.strip():
            out.append(SpanPrediction(key=key, value=span.strip(), confidence=1.0))
    return out


def extract_spans(
    extractor_id: ExtractorId,
    text: str,
    entity_types: Sequence[str],
    *,
    threshold: float = 0.5,
    with_confidence: bool = True,
) -> list[SpanPrediction]:
    model = load_extractor(extractor_id)
    include_conf = with_confidence
    batch = model.batch_extract_entities(
        [text],
        entity_types=list(entity_types),
        batch_size=1,
        threshold=threshold,
        include_confidence=include_conf,
        include_spans=include_conf,
    )
    row = batch[0] if batch else {}
    entities = row.get("entities") if isinstance(row, dict) else {}
    preds: list[SpanPrediction] = []
    if isinstance(entities, dict):
        for key, spans in entities.items():
            preds.extend(_parse_entity_spans(str(key), spans))
    return preds
