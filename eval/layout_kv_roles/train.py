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
from layout_kv_roles.synthetic_corpus import (  # noqa: E402
    SyntheticDocument,
    SyntheticEntity,
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


def _entities_for_document(doc: SyntheticDocument) -> list[LayoutEntity]:
    texts = [entity.text for entity in doc.entities]
    vectors = embed_passages(texts)
    entities: list[LayoutEntity] = []
    for idx, (entity, vector) in enumerate(zip(doc.entities, vectors, strict=True)):
        entities.append(
            LayoutEntity(
                index=idx,
                page=entity.page,
                x=entity.x,
                y=entity.y,
                width=entity.width,
                height=entity.height,
                text=entity.text,
                embedding=tuple(float(v) for v in vector),
            )
        )
    return entities


def _build_role_samples(documents: list[SyntheticDocument]) -> list[TrainSample]:
    samples: list[TrainSample] = []
    for doc in documents:
        entities = _entities_for_document(doc)
        for entity, spec in zip(entities, doc.entities, strict=True):
            features = entity_feature_vector(entity, entities)
            samples.append(TrainSample(features=features, label=ROLE_INDEX[spec.role]))
    return samples


def _build_link_samples(documents: list[SyntheticDocument]) -> list[LinkSample]:
    samples: list[LinkSample] = []
    for doc in documents:
        entities = _entities_for_document(doc)
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


def _load_cord_documents(max_docs: int) -> list[SyntheticDocument]:
    cord_dir = os.environ.get("CORD_DATA_DIR", "").strip()
    if not cord_dir:
        return []
    root = Path(cord_dir)
    if not root.is_dir():
        return []
    docs: list[SyntheticDocument] = []
    for path in sorted(root.glob("*.jsonl")):
        for line in path.read_text(encoding="utf-8").splitlines():
            if len(docs) >= max_docs:
                return docs
            payload = json.loads(line)
            if not isinstance(payload, dict):
                continue
            entities_raw = payload.get("entities")
            links_raw = payload.get("links")
            if not isinstance(entities_raw, list):
                continue
            entities: list[SyntheticEntity] = []
            for item in entities_raw:
                if not isinstance(item, dict):
                    continue
                role = item.get("role")
                text = item.get("text")
                if role not in ("other", "key", "value") or not isinstance(text, str):
                    continue
                entities.append(
                    SyntheticEntity(
                        page=int(item.get("page", 1)),
                        x=float(item.get("x", 0.1)),
                        y=float(item.get("y", 0.1)),
                        width=float(item.get("width", 0.2)),
                        height=float(item.get("height", 0.02)),
                        text=text,
                        role=role,
                    )
                )
            links: list[tuple[int, int]] = []
            if isinstance(links_raw, list):
                for pair in links_raw:
                    if (
                        isinstance(pair, list)
                        and len(pair) == 2
                        and isinstance(pair[0], int)
                        and isinstance(pair[1], int)
                    ):
                        links.append((pair[0], pair[1]))
            if entities:
                docs.append(
                    SyntheticDocument(
                        document_id=str(payload.get("document_id", f"cord-{len(docs)}")),
                        entities=tuple(entities),
                        links=tuple(links),
                    )
                )
    return docs


def _data_manifest(documents: list[SyntheticDocument]) -> list[str]:
    manifest = [
        "synthetic-forms:Docuvate CE generator (eval/layout_kv_roles/synthetic_corpus.py)",
    ]
    if os.environ.get("CORD_DATA_DIR"):
        manifest.append("CORD:CC-BY-4.0 (optional export via CORD_DATA_DIR)")
    if os.environ.get("ACROFORM_PDF_DIR"):
        manifest.append("acroform-pdfs:operator-verified license (ACROFORM_PDF_DIR)")
    manifest.append(f"synthetic_documents:{len(documents)}")
    return manifest


def train_and_write(*, seed: int, output: Path) -> None:
    random.seed(seed)
    np.random.seed(seed)
    documents = build_synthetic_documents()
    documents.extend(_load_cord_documents(max_docs=200))
    role_samples = _build_role_samples(documents)
    link_samples = _build_link_samples(documents)
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
            "data_manifest": _data_manifest(documents),
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
    args = parser.parse_args()
    train_and_write(seed=args.seed, output=args.output)


if __name__ == "__main__":
    main()
