# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from closed_form_ml.embeddings import embed_passages, l2_normalize
from closed_form_ml.layers import append_bias, ridge_solve, one_hot


@dataclass
class ConditionalFieldSuggester:
    """Suggest value type given label + token n-grams + e5 (ridge, closed form)."""

    label_ids: list[str]
    type_names: list[str]
    weights: np.ndarray

    @classmethod
    def fit(
        cls,
        examples: list[tuple[str, str, str]],
        *,
        type_names: list[str],
    ) -> ConditionalFieldSuggester:
        """examples: (label_id, value_text, type_name)"""
        label_ids = sorted({ex[0] for ex in examples})
        label_to_i = {lid: i for i, lid in enumerate(label_ids)}
        type_to_i = {t: i for i, t in enumerate(type_names)}
        feats: list[list[float]] = []
        y_idx: list[int] = []
        texts = [ex[1] for ex in examples]
        e5 = l2_normalize(embed_passages(texts))
        for row, (label, _text, typ) in enumerate(examples):
            label_oh = [0.0] * len(label_ids)
            label_oh[label_to_i[label]] = 1.0
            char3 = _char_hist(_text, 3)
            feat = label_oh + char3 + e5[row].tolist()
            feats.append(feat)
            y_idx.append(type_to_i[typ])
        x = np.asarray(feats, dtype=np.float64)
        y = one_hot(y_idx, len(type_names))
        w = ridge_solve(append_bias(x), y, reg=1e-2)
        return cls(label_ids, type_names, w)

    def suggest(self, label_id: str, value_text: str) -> tuple[str, float]:
        label_to_i = {lid: i for i, lid in enumerate(self.label_ids)}
        label_oh = [0.0] * len(self.label_ids)
        if label_id in label_to_i:
            label_oh[label_to_i[label_id]] = 1.0
        e5 = l2_normalize(embed_passages([value_text]))[0]
        char3 = _char_hist(value_text, 3)
        feat = np.asarray(label_oh + char3 + e5.tolist(), dtype=np.float64).reshape(1, -1)
        logits = (append_bias(feat) @ self.weights).reshape(-1)
        logits = logits - np.max(logits)
        probs = np.exp(logits)
        probs = probs / np.sum(probs)
        idx = int(np.argmax(probs))
        return self.type_names[idx], float(probs[idx])


def _char_hist(text: str, order: int) -> list[float]:
    text = text.lower().strip()
    if len(text) < order:
        return [0.0] * 256
    grams = [text[i : i + order] for i in range(len(text) - order + 1)]
    vec = np.zeros(256, dtype=np.float64)
    for g in grams:
        vec[hash(g) % 256] += 1.0
    total = float(np.sum(vec))
    if total > 0:
        vec /= total
    return vec.tolist()


def load_cord_value_examples(path: Path, *, max_rows: int = 4000) -> list[tuple[str, str, str]]:
    rows: list[tuple[str, str, str]] = []
    label = "receipt"
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            if len(rows) >= max_rows:
                break
            payload = json.loads(line)
            text = str(payload.get("text", ""))
            typ = str(payload.get("type_name", "free_text"))
            if not text:
                continue
            rows.append((label, text, typ))
    return rows
