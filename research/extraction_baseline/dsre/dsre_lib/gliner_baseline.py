# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from pathlib import Path

from dsre_lib.constants import SPLIT_TEST
from dsre_lib.normalize import normalize_value
from dsre_lib.npz_store import DsreNpz

_gliner = None


def _model():
    global _gliner  # noqa: PLW0603
    if _gliner is None:
        from gliner2 import GLiNER2

        cache = Path(__file__).resolve().parents[1] / ".cache" / "huggingface"
        _gliner = GLiNER2.from_pretrained("fastino/gliner2-base-v1", cache_dir=str(cache))
    return _gliner


def gliner_predictions_for_npz(data: DsreNpz, schema_keys: list[str]) -> dict[str, float]:
    """Field-level micro-F1 on test episodes using GLiNER2 entity lists."""
    # Group episodes by document text reconstructed from candidates (first episode slice).
    from collections import defaultdict

    doc_fields: dict[str, list[int]] = defaultdict(list)
    for ep in range(len(data.gold)):
        if int(data.split[ep]) != SPLIT_TEST:
            continue
        doc_fields[str(data.doc_id[ep])].append(ep)

    # Build doc text as concatenation of unique candidate texts for first episode.
    doc_text: dict[str, str] = {}
    for doc_id, eps in doc_fields.items():
        ep0 = eps[0]
        doc_idx = int(data.episode_doc[ep0])
        start, end = int(data.offsets[doc_idx]), int(data.offsets[doc_idx + 1])
        parts = [str(t) for t in data.candidate_text[start:end]]
        doc_text[doc_id] = "\n".join(dict.fromkeys(parts))

    model = _model()
    tp = fp = fn = 0
    for doc_id, eps in doc_fields.items():
        text = doc_text[doc_id]
        batch = model.batch_extract_entities([text], entity_types=schema_keys)
        entities = batch[0].get("entities", {}) if batch else {}
        for ep in eps:
            if data.field_absent[ep]:
                continue
            key = schema_keys[int(data.field_key[ep])]
            gold_idx = int(data.gold[ep])
            gold_val = (
                normalize_value(str(data.candidate_text[gold_idx])) if gold_idx >= 0 else ""
            )
            preds = entities.get(key, []) if isinstance(entities, dict) else []
            pred_val = normalize_value(str(preds[0])) if preds else ""
            if not gold_val:
                fn += 1
                continue
            if pred_val == gold_val:
                tp += 1
            else:
                fp += 1
                fn += 1
    prec = tp / (tp + fp) if (tp + fp) else 0.0
    rec = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = 2 * prec * rec / (prec + rec) if (prec + rec) else 0.0
    return {"micro_precision": prec, "micro_recall": rec, "micro_f1": f1}
