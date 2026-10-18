#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Probe Docuvate E5 ONNX artifact: I/O shapes and token-level hidden states."""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

import numpy as np

REPO_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO_ROOT / "apps" / "worker" / "src"))

os.environ.setdefault("OMP_NUM_THREADS", "4")
os.environ.setdefault("DOCUVATE_ENCODER_INTRA_OP_THREADS", "4")

from docuvate_worker.infrastructure.onnx_e5_encoder import (  # noqa: E402
    _feed_batch,
    _load_artifacts,
    _mean_pool,
    _normalize,
    embed_texts_onnx,
    encoder_runtime_info,
)


def main() -> int:
    info = encoder_runtime_info()
    session, tokenizer, onnx_path = _load_artifacts()
    outputs = [(o.name, o.shape, o.type) for o in session.get_outputs()]
    inputs = [(i.name, i.shape, i.type) for i in session.get_inputs()]

    sample = "passage: " + ("receipt line " * 40)
    encoded = tokenizer.encode(sample)
    max_len = min(len(encoded.ids), 512)
    ids = np.array([encoded.ids[:max_len]], dtype=np.int64)
    mask = np.array([encoded.attention_mask[:max_len]], dtype=np.int64)

    t0 = time.perf_counter()
    hidden = _feed_batch(session, ids, mask)
    ms_hidden = (time.perf_counter() - t0) * 1000.0

    pooled = _normalize(_mean_pool(hidden, mask))
    t1 = time.perf_counter()
    _ = embed_texts_onnx([sample])
    ms_full = (time.perf_counter() - t1) * 1000.0

    token_vectors = hidden[0, : max_len, :]
    token_norms = np.linalg.norm(token_vectors, axis=1)

    report = {
        "runtime": info,
        "onnx_path": str(onnx_path),
        "inputs": inputs,
        "outputs": outputs,
        "sequence_length_sample": int(max_len),
        "last_hidden_state_shape": list(hidden.shape),
        "token_level_access": hidden.ndim == 3 and hidden.shape[-1] == 384,
        "mean_pool_pooled_dim": int(pooled.shape[-1]),
        "latency_ms": {"last_hidden_forward": ms_hidden, "embed_texts_onnx": ms_full},
        "token_vector_norm_mean": float(token_norms.mean()),
        "reuse_notes": (
            "Production embed_texts_onnx mean-pools last_hidden_state; span baselines can "
            "call _feed_batch + slice hidden[batch, token, :] before pooling."
        ),
    }
    out = REPO_ROOT / "research" / "extraction_baseline" / "results" / "e5_onnx_probe.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
