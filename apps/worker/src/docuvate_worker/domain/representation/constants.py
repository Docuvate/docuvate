# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Versioned constants for the central document representation."""

from __future__ import annotations

ENCODER_ID = "intfloat/multilingual-e5-small"
# Pinned Hugging Face weights revision (MIT).
ENCODER_HF_REVISION = "614241f622f53c4eeff9890bdc4f31cfecc418b3"
# Stored on each document; bumps when the runtime artifact changes (ONNX int8 vs legacy backends).
ENCODER_REVISION = f"{ENCODER_HF_REVISION}-onnx-int8"
ENCODER_ONNX_DIR = "onnx"
ENCODER_ONNX_FILE = "model_qint8_avx512_vnni.onnx"
# ARM64 lacks AVX512 VNNI; use a smaller dynamic-quantized graph (higher RAM than int8 VNNI).
ENCODER_ONNX_FILE_ARM_FALLBACK = "model_O4.onnx"
REPRESENTATION_VERSION = 1
EMBEDDING_DIM = 384
BINARY_CODE_BYTES = 48
PASSAGE_PREFIX = "passage: "
QUERY_PREFIX = "query: "
