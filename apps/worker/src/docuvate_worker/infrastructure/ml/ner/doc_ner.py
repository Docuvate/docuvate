# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

import numpy as np
import onnxruntime as ort

from docuvate_worker.infrastructure.ml.docai.paths import ner_doc_model_path
from docuvate_worker.infrastructure.onnx_e5_encoder import embed_texts_onnx

NER_DOC_MODEL_KEY = "docuvate:ner-doc-int8"

_DOC_TAG_NAMES: tuple[str, ...] = (
    "O",
    "B-PER",
    "I-PER",
    "B-ORG",
    "I-ORG",
    "B-LOC",
    "I-LOC",
    "B-DATE",
    "I-DATE",
    "B-MONEY",
    "I-MONEY",
)


@dataclass(frozen=True)
class NerWord:
    text: str
    box: tuple[float, float, float, float]


@dataclass(frozen=True)
class NerSpan:
    start_index: int
    end_index: int
    entity_type: str


def _shape_features(word: str) -> list[float]:
    return [
        float(word[:1].isupper()),
        float(word.isupper() and len(word) > 1),
        float(any(ch.isdigit() for ch in word)),
        float(all(ch.isdigit() or ch in "., " for ch in word)),
        float(not any(ch.isalnum() for ch in word)),
        float("-" in word),
        min(len(word), 20) / 20.0,
        float(word[:1].islower()),
    ]


@lru_cache(maxsize=1)
def _session() -> ort.InferenceSession:
    path = ner_doc_model_path()
    if not path.is_file():
        msg = f"NER model missing: {path}"
        raise FileNotFoundError(msg)
    options = ort.SessionOptions()
    options.intra_op_num_threads = 2
    options.inter_op_num_threads = 1
    return ort.InferenceSession(str(path), options, providers=["CPUExecutionProvider"])


def predict_doc_ner_spans(
    words: list[NerWord],
    *,
    page_width: float,
    page_height: float,
) -> list[NerSpan]:
    if not words:
        return []
    texts = [word.text for word in words]
    vectors = np.asarray(embed_texts_onnx([f"query: {text}" for text in texts]), dtype=np.float32)
    shape = np.asarray([_shape_features(text) for text in texts], dtype=np.float32)
    features = np.hstack([vectors, shape]).astype(np.float32)[None, ...]
    centers = np.array(
        [
            [
                (word.box[0] + word.box[2]) / 2.0 / max(page_width, 1.0),
                (word.box[1] + word.box[3]) / 2.0 / max(page_height, 1.0),
            ]
            for word in words
        ],
        dtype=np.float32,
    )[None, ...]
    probabilities = _session().run(None, {"X": features, "c": centers})[0][0]
    tags = probabilities.argmax(axis=-1)
    spans: list[NerSpan] = []
    current: list[int] | None = None
    current_type = ""
    for index, tag_id in enumerate([*list(tags), 0]):
        label = _DOC_TAG_NAMES[int(tag_id)]
        if current and (label == "O" or label.startswith("B-") or label[2:] != current_type):
            spans.append(NerSpan(start_index=current[0], end_index=current[1], entity_type=current_type))
            current = None
        if label != "O" and current is None:
            current = [index, index + 1]
            current_type = label[2:]
        elif current is not None:
            current[1] = index + 1
    return spans
