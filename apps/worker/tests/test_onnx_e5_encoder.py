# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import json
import math
from pathlib import Path

from docuvate_worker.domain.representation.constants import (
    ENCODER_HF_REVISION,
    ENCODER_ONNX_FILE,
    ENCODER_REVISION,
)
from docuvate_worker.infrastructure.onnx_e5_encoder import embed_texts_onnx

_FIXTURE = Path(__file__).resolve().parent / "fixtures" / "e5_onnx_int8_fidelity.json"


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def test_encoder_revision_tagged_for_onnx_int8() -> None:
    assert ENCODER_REVISION.endswith("-onnx-int8")
    assert ENCODER_HF_REVISION in ENCODER_REVISION


def test_onnx_int8_matches_fp32_fixture() -> None:
    payload = json.loads(_FIXTURE.read_text(encoding="utf-8"))
    pairs = payload["pairs"]
    assert isinstance(pairs, list) and len(pairs) >= 2
    for entry in pairs:
        text = str(entry["text"])
        expected_fp32 = [float(x) for x in entry["fp32"]]
        vec = embed_texts_onnx([text])[0]
        assert len(vec) == len(expected_fp32)
        assert _cosine(vec, expected_fp32) >= 0.97


def test_onnx_int8_vectors_are_unit_normalized() -> None:
    vec = embed_texts_onnx(["passage: Rechnung Nr. 4711"])[0]
    norm = math.sqrt(sum(x * x for x in vec))
    assert abs(norm - 1.0) < 1e-4


def test_onnx_int8_uses_vnni_graph_on_x86() -> None:
    from docuvate_worker.infrastructure.onnx_e5_encoder import _resolve_onnx_filename

    import platform

    if platform.machine().lower() in {"x86_64", "amd64"}:
        assert _resolve_onnx_filename() == ENCODER_ONNX_FILE
