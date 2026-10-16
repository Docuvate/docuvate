#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

import numpy as np
from datasets import load_dataset

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from dsre_lib.candidates import generate_candidates, gold_candidate_index
from dsre_lib.constants import CORD_SCHEMA, SROIE_SCHEMA, SPLIT_TEST
from dsre_lib.e5_encode import embed_document_token_matrix, embed_queries, pool_span_from_tokens
from dsre_lib.layout_docs import cord_document, sroie_document
from dsre_lib.npz_store import DsreNpz
from dsre_lib.splits import assert_families_do_not_cross_splits, assign_splits


def load_documents(dataset: str) -> list:
    docs = []
    if dataset == "cord":
        for split_name in ("train", "validation", "test"):
            hf_split = "validation" if split_name == "validation" else split_name
            rows = load_dataset("naver-clova-ix/cord-v2", split=hf_split)
            for idx, row in enumerate(rows):
                docs.append(
                    cord_document(row, doc_id=f"cord-{split_name}-{idx}", split_name=split_name)
                )
    elif dataset == "sroie":
        for split_name in ("train", "test"):
            rows = load_dataset("rth/sroie-2019-v2", split=split_name)
            for idx, row in enumerate(rows):
                docs.append(
                    sroie_document(row, doc_id=f"sroie-{split_name}-{idx}", split_name=split_name)
                )
    else:
        raise ValueError(dataset)
    return docs


def build(dataset: str, out_path: Path) -> dict[str, float]:
    schema = CORD_SCHEMA if dataset == "cord" else SROIE_SCHEMA
    descriptions = [d for _, d, _ in schema]
    schema_vec = embed_queries(descriptions)

    docs = load_documents(dataset)
    split_names = ["test" if d.split_name == "test" else "train" for d in docs]
    split_codes = assign_splits(split_names, [d.family_id for d in docs])
    for idx, doc in enumerate(docs):
        if doc.split_name == "test":
            split_codes[idx] = SPLIT_TEST
    assert_families_do_not_cross_splits(split_codes, [d.family_id for d in docs])

    span_rows: list[np.ndarray] = []
    layout_rows: list[np.ndarray] = []
    candidate_texts: list[str] = []
    doc_offsets = [0]

    gold: list[int] = []
    split: list[int] = []
    family: list[int] = []
    field_type: list[int] = []
    field_key: list[int] = []
    field_absent: list[bool] = []
    doc_ids: list[str] = []
    episode_doc: list[int] = []

    present_total = 0
    candidate_recall_hits = 0

    t0 = time.perf_counter()
    for doc_idx, doc in enumerate(docs):
        candidates = generate_candidates(doc)
        token_hidden, token_offsets = embed_document_token_matrix(doc.text)
        base = len(span_rows)
        for cand in candidates:
            vec = pool_span_from_tokens(token_hidden, token_offsets, cand.char_start, cand.char_end)
            span_rows.append(vec)
            layout_rows.append(np.array([cand.xc, cand.yc, cand.w, cand.h], dtype=np.float32))
            candidate_texts.append(cand.text)
        doc_offsets.append(len(span_rows))

        for key_idx, (field, _desc, ftype) in enumerate(schema):
            absent = not doc.gt_present.get(field, False)
            value = doc.gt_fields.get(field)
            local_gold = -1
            if not absent and value is not None:
                present_total += 1
                local_idx = gold_candidate_index(candidates, value)
                if local_idx >= 0:
                    local_gold = base + local_idx
                    candidate_recall_hits += 1

            gold.append(local_gold)
            split.append(split_codes[doc_idx])
            family.append(doc.family_id)
            field_type.append(ftype)
            field_key.append(key_idx)
            field_absent.append(absent)
            doc_ids.append(doc.doc_id)
            episode_doc.append(doc_idx)

    span_vec = np.stack(span_rows, axis=0).astype(np.float32)
    layout = np.stack(layout_rows, axis=0).astype(np.float32)
    pack = DsreNpz(
        schema_vec=schema_vec.astype(np.float32),
        span_vec=span_vec,
        layout=layout,
        offsets=np.array(doc_offsets, dtype=np.int64),
        gold=np.array(gold, dtype=np.int64),
        split=np.array(split, dtype=np.int8),
        family=np.array(family, dtype=np.int64),
        field_type=np.array(field_type, dtype=np.int16),
        field_key=np.array(field_key, dtype=np.int16),
        field_absent=np.array(field_absent, dtype=bool),
        doc_id=np.array(doc_ids),
        candidate_text=np.array(candidate_texts),
        episode_doc=np.array(episode_doc, dtype=np.int32),
    )
    pack.save(out_path)
    elapsed = time.perf_counter() - t0
    return {
        "episodes": float(len(gold)),
        "documents": float(len(docs)),
        "candidates": float(len(span_rows)),
        "candidate_recall": candidate_recall_hits / present_total if present_total else 0.0,
        "build_seconds": elapsed,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", choices=("cord", "sroie"), required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    stats = build(args.dataset, args.out)
    print(stats)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
