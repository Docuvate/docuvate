# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Reproducible training for the layout KV linear head (commercial data only)."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import random
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
EVAL_DIR = ROOT / "eval"
WORKER_SRC = ROOT / "apps" / "worker" / "src"
sys.path.insert(0, str(WORKER_SRC))
sys.path.insert(0, str(EVAL_DIR))

from docuvate_worker.domain.representation.constants import (  # noqa: E402
    ENCODER_ID,
    ENCODER_REVISION,
)
from docuvate_worker.infrastructure.fastembed_model import embed_passages  # noqa: E402
from docuvate_worker.infrastructure.ml.layout_kv_roles.features import (  # noqa: E402
    ENTITY_FEATURE_DIM,
    LINK_EXTRA_DIM,
    LayoutEntity,
    entity_feature_vector,
    link_feature_vector,
)
from docuvate_worker.infrastructure.ml.layout_kv_roles.model import ROLE_INDEX  # noqa: E402
from layout_kv_roles.corpus import load_cord_train_documents  # noqa: E402
from layout_kv_roles.synthetic_corpus import (  # noqa: E402
    SyntheticDocument,
    build_synthetic_documents,
)

DEFAULT_OUTPUT = (
    WORKER_SRC
    / "docuvate_worker"
    / "infrastructure"
    / "ml"
    / "artifacts"
    / "layout-kv-role-head.v1.json"
)


@dataclass(frozen=True)
class TrainSample:
    features: list[float]
    label: int


@dataclass(frozen=True)
class LinkSample:
    features: list[float]
    label: int


def _embed_documents(documents: list[SyntheticDocument]) -> list[list[LayoutEntity]]:
    texts: list[str] = []
    spans: list[tuple[int, int]] = []
    for doc in documents:
        start = len(texts)
        texts.extend(entity.text for entity in doc.entities)
        spans.append((start, len(texts)))
    vectors: list[list[float]] = []
    batch_size = 64
    for start in range(0, len(texts), batch_size):
        chunk = texts[start : start + batch_size]
        vectors.extend(embed_passages(chunk))
    per_doc: list[list[LayoutEntity]] = []
    for doc, (start, end) in zip(documents, spans, strict=True):
        entities: list[LayoutEntity] = []
        for idx, (spec, vector) in enumerate(
            zip(doc.entities, vectors[start:end], strict=True)
        ):
            entities.append(
                LayoutEntity(
                    index=idx,
                    page=spec.page,
                    x=spec.x,
                    y=spec.y,
                    width=spec.width,
                    height=spec.height,
                    text=spec.text,
                    embedding=tuple(float(v) for v in vector),
                )
            )
        per_doc.append(entities)
    return per_doc


def _build_role_samples(
    documents: list[SyntheticDocument], embedded: list[list[LayoutEntity]]
) -> list[TrainSample]:
    samples: list[TrainSample] = []
    for doc, entities in zip(documents, embedded, strict=True):
        for entity, spec in zip(entities, doc.entities, strict=True):
            features = entity_feature_vector(entity, entities)
            samples.append(TrainSample(features=features, label=ROLE_INDEX[spec.role]))
    return samples


def _build_link_samples(
    documents: list[SyntheticDocument], embedded: list[list[LayoutEntity]]
) -> list[LinkSample]:
    samples: list[LinkSample] = []
    for doc, entities in zip(documents, embedded, strict=True):
        positive_pairs = {pair for pair in doc.links}
        for key_idx in range(len(entities)):
            for value_idx in range(len(entities)):
                if key_idx == value_idx:
                    continue
                key_entity = entities[key_idx]
                value_entity = entities[value_idx]
                features = link_feature_vector(key_entity, value_entity)
                label = 1 if (key_idx, value_idx) in positive_pairs else 0
                samples.append(LinkSample(features=features, label=label))
    return samples


def _fit_multiclass_logistic(
    samples: list[TrainSample],
    *,
    seed: int,
    classes: int,
) -> np.ndarray:
    try:
        from sklearn.linear_model import LogisticRegression  # noqa: PLC0415
    except ImportError as exc:
        msg = "scikit-learn is required for training (pip install scikit-learn)"
        raise SystemExit(msg) from exc
    x = np.asarray([sample.features for sample in samples], dtype=np.float64)
    y = np.asarray([sample.label for sample in samples], dtype=np.int64)
    model = LogisticRegression(max_iter=400, random_state=seed, solver="lbfgs")
    model.fit(x, y)
    weights = np.zeros((classes, ENTITY_FEATURE_DIM + 1), dtype=np.float64)
    for class_idx in range(classes):
        weights[class_idx, 0] = float(model.intercept_[class_idx])
        weights[class_idx, 1:] = model.coef_[class_idx]
    return weights.astype(np.float32)


def _fit_binary_logistic(samples: list[LinkSample], *, seed: int) -> np.ndarray:
    try:
        from sklearn.linear_model import LogisticRegression  # noqa: PLC0415
    except ImportError as exc:
        msg = "scikit-learn is required for training (pip install scikit-learn)"
        raise SystemExit(msg) from exc
    x = np.asarray([sample.features for sample in samples], dtype=np.float64)
    y = np.asarray([sample.label for sample in samples], dtype=np.int64)
    model = LogisticRegression(max_iter=400, random_state=seed, solver="lbfgs")
    model.fit(x, y)
    row = np.zeros(ENTITY_FEATURE_DIM * 2 + LINK_EXTRA_DIM + 1, dtype=np.float64)
    row[0] = float(model.intercept_[0])
    row[1:] = model.coef_[0]
    return row.astype(np.float32).reshape(1, -1)


def _data_manifest(
    *,
    synthetic_count: int,
    cord_count: int,
) -> list[str]:
    manifest = [
        "synthetic-forms:Docuvate CE generator (eval/layout_kv_roles/synthetic_corpus.py)",
        "CORD:CC-BY-4.0 (naver-clova-ix/cord-v2 train split)",
    ]
    if os.environ.get("ACROFORM_PDF_DIR"):
        manifest.append("acroform-pdfs:operator-verified license (ACROFORM_PDF_DIR)")
    manifest.append(f"synthetic_documents:{synthetic_count}")
    manifest.append(f"cord_documents:{cord_count}")
    return manifest


def train_and_write(*, seed: int, output: Path, cord_max_docs: int | None) -> None:
    random.seed(seed)
    np.random.seed(seed)
    synthetic_docs = build_synthetic_documents()
    cord_docs = load_cord_train_documents(max_docs=cord_max_docs)
    documents = synthetic_docs + cord_docs
    embedded = _embed_documents(documents)
    role_samples = _build_role_samples(documents, embedded)
    link_samples = _build_link_samples(documents, embedded)
    role_weights = _fit_multiclass_logistic(role_samples, seed=seed, classes=3)
    link_weights = _fit_binary_logistic(link_samples, seed=seed)
    artifact = {
        "version": 1,
        "encoder_id": ENCODER_ID,
        "encoder_revision": ENCODER_REVISION,
        "role_weights": role_weights.tolist(),
        "link_weights": link_weights.tolist(),
        "thresholds": {
            "role_min_confidence": 0.4,
            "link_min_confidence": 0.55,
        },
        "training": {
            "seed": seed,
            "role_train_samples": len(role_samples),
            "link_train_samples": len(link_samples),
            "data_manifest": _data_manifest(
                synthetic_count=len(synthetic_docs),
                cord_count=len(cord_docs),
            ),
        },
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf-8")
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    print(f"wrote {output} sha256={digest} bytes={output.stat().st_size}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument(
        "--cord-max-docs",
        type=int,
        default=None,
        help="Limit CORD train documents (default: full train split)",
    )
    args = parser.parse_args()
    train_and_write(seed=args.seed, output=args.output, cord_max_docs=args.cord_max_docs)


if __name__ == "__main__":
    main()
