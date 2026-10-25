# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from pathlib import Path

import pytest

from docuvate_worker.infrastructure.onnx_e5_encoder import (
    resolve_docai_onnx_model_path,
    resolve_e5_tokenizer_path,
)


def test_resolve_docai_onnx_prefers_quantized(tmp_path: Path) -> None:
    onnx_dir = tmp_path / "onnx"
    onnx_dir.mkdir()
    (onnx_dir / "model.onnx").write_bytes(b"full")
    (onnx_dir / "model_quantized.onnx").write_bytes(b"quant")
    (onnx_dir / "tokenizer.json").write_text("{}", encoding="utf-8")
    assert resolve_docai_onnx_model_path(tmp_path).name == "model_quantized.onnx"
    assert resolve_e5_tokenizer_path(tmp_path).name == "tokenizer.json"


def test_resolve_docai_onnx_falls_back_to_available_file(tmp_path: Path) -> None:
    onnx_dir = tmp_path / "onnx"
    onnx_dir.mkdir()
    (onnx_dir / "model_O4.onnx").write_bytes(b"o4")
    (onnx_dir / "tokenizer.json").write_text("{}", encoding="utf-8")
    assert resolve_docai_onnx_model_path(tmp_path).name == "model_O4.onnx"


def test_resolve_docai_onnx_raises_when_missing(tmp_path: Path) -> None:
    onnx_dir = tmp_path / "onnx"
    onnx_dir.mkdir()
    with pytest.raises(FileNotFoundError):
        resolve_docai_onnx_model_path(tmp_path)
