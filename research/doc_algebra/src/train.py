"""Train all baseline models on synthetic corpus."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib

from baselines import ModelBundle, train_model
from features import fit_learned_B_from_synthetic_pairs
from features import build_element_row


def docs_to_dicts(docs: list[Any]) -> list[dict[str, Any]]:
    return [d.to_dict() if hasattr(d, "to_dict") else d for d in docs]


def prepare_learned_B(train_docs: list[dict[str, Any]]):
    rows_per_doc = []
    for doc in train_docs:
        rows = [build_element_row(e, doc["page_w"], doc["page_h"]) for e in doc["elements"]]
        rows_per_doc.append(rows)
    return fit_learned_B_from_synthetic_pairs(rows_per_doc)


def train_all(
    train_docs: list[dict[str, Any]],
    seed: int = 42,
) -> dict[str, ModelBundle]:
    keys = ["A", "B2", "B3", "C", "D", "E", "F", "G", "H"]
    B_learned = prepare_learned_B(train_docs)
    bundles: dict[str, ModelBundle] = {}
    for key in keys:
        lb = B_learned if key == "F" else None
        bundles[key] = train_model(train_docs, key, learned_B=lb, seed=seed)  # type: ignore[arg-type]
    return bundles


def save_bundles(bundles: dict[str, ModelBundle], out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    for k, b in bundles.items():
        joblib.dump(b, out_dir / f"model_{k}.joblib")


def main() -> None:
    from data_generator import generate_corpus, save_corpus

    docs = generate_corpus(500, 42)
    save_corpus(docs, Path("results"))
    train_docs = [d.to_dict() for d in docs if d.split == "train"]
    bundles = train_all(train_docs)
    save_bundles(bundles, Path("results/models"))
    meta = {k: {"n_features": v.n_features, "train_time_s": v.train_time_s} for k, v in bundles.items()}
    Path("results/train_meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
