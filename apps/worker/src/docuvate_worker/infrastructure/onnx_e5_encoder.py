# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""ONNX Runtime int8 CPU encoder for intfloat/multilingual-e5-small."""

from __future__ import annotations

import logging
import os
import platform
import threading
from pathlib import Path

import numpy as np
import onnxruntime as ort
from huggingface_hub import hf_hub_download
from numpy.typing import NDArray
from tokenizers import Tokenizer

from docuvate_worker.domain.representation.constants import (
    ENCODER_HF_REVISION,
    ENCODER_ID,
    ENCODER_ONNX_DIR,
    ENCODER_ONNX_FILE,
    ENCODER_ONNX_FILE_ARM_FALLBACK,
)
from docuvate_worker.infrastructure.worker_memory_hygiene import reclaim_python_heap

logger = logging.getLogger(__name__)

_MAX_TOKENS = 512
_lock = threading.Lock()
_session: ort.InferenceSession | None = None
_tokenizer: Tokenizer | None = None
_onnx_path: Path | None = None


def release_onnx_encoder() -> None:
    global _session, _tokenizer, _onnx_path  # noqa: PLW0603
    with _lock:
        session = _session
        _session = None
        _tokenizer = None
        _onnx_path = None
        if session is not None:
            del session
    reclaim_python_heap()


def _cache_dir() -> Path:
    raw = os.environ.get("DOCUVATE_ENCODER_CACHE_DIR") or os.environ.get("FASTEMBED_CACHE_PATH")
    if raw:
        return Path(raw) / "multilingual-e5-small-onnx"
    return Path.home() / ".cache" / "docuvate" / "multilingual-e5-small-onnx"


def _resolve_onnx_filename() -> str:
    override = os.environ.get("DOCUVATE_ENCODER_ONNX_FILE", "").strip()
    if override:
        return override
    machine = platform.machine().lower()
    if machine in {"x86_64", "amd64"}:
        return ENCODER_ONNX_FILE
    return ENCODER_ONNX_FILE_ARM_FALLBACK


def _intra_op_threads() -> int:
    raw = os.environ.get("DOCUVATE_ENCODER_INTRA_OP_THREADS", "").strip()
    if raw.isdigit() and int(raw) > 0:
        return int(raw)
    omp = os.environ.get("OMP_NUM_THREADS", "").strip()
    if omp.isdigit() and int(omp) > 0:
        return int(omp)
    return 4


def _load_artifacts() -> tuple[ort.InferenceSession, Tokenizer, Path]:
    global _session, _tokenizer, _onnx_path  # noqa: PLW0603
    if _session is not None and _tokenizer is not None and _onnx_path is not None:
        return _session, _tokenizer, _onnx_path
    with _lock:
        if _session is not None and _tokenizer is not None and _onnx_path is not None:
            return _session, _tokenizer, _onnx_path
        cache = _cache_dir()
        onnx_file = _resolve_onnx_filename()
        onnx_path = Path(
            hf_hub_download(
                ENCODER_ID,
                f"{ENCODER_ONNX_DIR}/{onnx_file}",
                revision=ENCODER_HF_REVISION,
                cache_dir=cache,
            )
        )
        tok_path = hf_hub_download(
            ENCODER_ID,
            f"{ENCODER_ONNX_DIR}/tokenizer.json",
            revision=ENCODER_HF_REVISION,
            cache_dir=cache,
        )
        options = ort.SessionOptions()
        options.intra_op_num_threads = _intra_op_threads()
        options.inter_op_num_threads = 1
        session = ort.InferenceSession(
            str(onnx_path),
            sess_options=options,
            providers=["CPUExecutionProvider"],
        )
        tokenizer = Tokenizer.from_file(tok_path)
        _session = session
        _tokenizer = tokenizer
        _onnx_path = onnx_path
        logger.info(
            "encoder_backend=onnxruntime model=%s revision=%s onnx=%s threads=%s",
            ENCODER_ID,
            ENCODER_HF_REVISION,
            onnx_file,
            _intra_op_threads(),
        )
        return session, tokenizer, onnx_path


def encoder_runtime_info() -> dict[str, str | int]:
    _, _, path = _load_artifacts()
    return {
        "encoder_id": ENCODER_ID,
        "encoder_hf_revision": ENCODER_HF_REVISION,
        "onnx_file": _resolve_onnx_filename(),
        "onnx_path": str(path),
        "intra_op_threads": _intra_op_threads(),
        "backend": "onnxruntime",
    }


def _feed_batch(
    session: ort.InferenceSession,
    input_ids: NDArray[np.int64],
    attention_mask: NDArray[np.int64],
) -> NDArray[np.float32]:
    token_type_ids = np.zeros_like(input_ids)
    feed: dict[str, NDArray[np.int64]] = {}
    for input_meta in session.get_inputs():
        name = input_meta.name
        if "input_ids" in name:
            feed[name] = input_ids
        elif "attention" in name:
            feed[name] = attention_mask
        elif "token_type" in name:
            feed[name] = token_type_ids
    outputs = session.run(None, feed)
    return np.asarray(outputs[0], dtype=np.float32)


def _mean_pool(
    last_hidden: NDArray[np.float32], attention_mask: NDArray[np.int64]
) -> NDArray[np.float32]:
    mask = attention_mask.astype(np.float32)[:, :, np.newaxis]
    summed = (last_hidden * mask).sum(axis=1)
    counts = np.clip(mask.sum(axis=1), 1e-9, None)
    return summed / counts


def _normalize(vectors: NDArray[np.float32]) -> NDArray[np.float32]:
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms = np.clip(norms, 1e-12, None)
    return vectors / norms


def _encode_tokenized(
    session: ort.InferenceSession,
    tokenizer: Tokenizer,
    texts: list[str],
) -> list[list[float]]:
    if not texts:
        return []
    encoded = [tokenizer.encode(text) for text in texts]
    max_len = min(max(len(item.ids) for item in encoded), _MAX_TOKENS)
    batch = len(encoded)
    input_ids = np.zeros((batch, max_len), dtype=np.int64)
    attention_mask = np.zeros((batch, max_len), dtype=np.int64)
    for row, item in enumerate(encoded):
        ids = item.ids[:max_len]
        attn = item.attention_mask[:max_len]
        input_ids[row, : len(ids)] = np.asarray(ids, dtype=np.int64)
        attention_mask[row, : len(attn)] = np.asarray(attn, dtype=np.int64)
    hidden = _feed_batch(session, input_ids, attention_mask)
    pooled = _mean_pool(hidden, attention_mask)
    normalized = _normalize(pooled)
    return [[float(x) for x in row] for row in normalized]


def embed_texts_onnx(texts: list[str]) -> list[list[float]]:
    session, tokenizer, _ = _load_artifacts()
    return _encode_tokenized(session, tokenizer, texts)
