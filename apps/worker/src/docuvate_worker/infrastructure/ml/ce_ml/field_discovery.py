# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from scipy.cluster.hierarchy import fcluster, linkage
from scipy.spatial.distance import pdist

from docuvate_worker.infrastructure.ml.ce_ml.calibration import (
    field_abstain_threshold,
    load_ce_ml_calibration,
)
from docuvate_worker.infrastructure.ml.ce_ml.kv_items import KeyValueItem
from docuvate_worker.infrastructure.onnx_e5_encoder import embed_texts_onnx


@dataclass(frozen=True)
class DiscoveredField:
    field_key: str
    display_name: str
    confidence: float
    kind: str


def _open_set_params() -> tuple[float, float, float]:
    raw = load_ce_ml_calibration()["openSetFieldDiscovery"]
    return float(raw["keyClusterTau"]), float(raw["minDocFrequencyPhi"]), float(raw["keylessClusterTau2"])


def _slug(name: str) -> str:
    lowered = "".join(ch.lower() if ch.isalnum() else "_" for ch in name.strip())
    parts = [part for part in lowered.split("_") if part]
    return "_".join(parts) or "field"


def discover_conditional_fields(
    items_by_document: dict[str, list[KeyValueItem]],
    *,
    label_confidence: float,
) -> list[DiscoveredField]:
    tau, phi, tau2 = _open_set_params()
    abstain = field_abstain_threshold()
    if label_confidence < abstain:
        return []
    doc_ids = sorted(items_by_document)
    doc_count = max(len(doc_ids), 1)
    keyed = [(doc_id, item) for doc_id in doc_ids for item in items_by_document[doc_id] if item.key_text]
    keyless = [(doc_id, item) for doc_id in doc_ids for item in items_by_document[doc_id] if not item.key_text]

    discovered: list[DiscoveredField] = []
    if len(keyed) >= 2:
        keys = [item.key_text or "" for _, item in keyed]
        embeddings = np.asarray(embed_texts_onnx([f"query: {text}" for text in keys]), dtype=np.float32)
        dist = pdist(embeddings, metric="cosine")
        hierarchy = linkage(dist, method="average")
        labels = fcluster(hierarchy, t=tau, criterion="distance") - 1
        for cluster_id in sorted(set(labels.tolist())):
            members = [keyed[i] for i, lab in enumerate(labels) if lab == cluster_id]
            supporting_docs = {doc_id for doc_id, _ in members}
            if len(supporting_docs) / doc_count < phi:
                continue
            name = max({item.key_text or "" for _, item in members}, key=len)
            confidence = min(1.0, label_confidence * (len(supporting_docs) / doc_count))
            if confidence < abstain:
                continue
            discovered.append(
                DiscoveredField(
                    field_key=_slug(name),
                    display_name=name.strip(),
                    confidence=confidence,
                    kind="key_cluster",
                )
            )

    if len(keyless) >= 2:
        features = np.stack(
            [
                np.r_[
                    [1.0 if item.value_entity == ent else 0.0 for ent in range(5)],
                    item.position[0],
                    item.position[1] + item.position[3],
                ]
                for _, item in keyless
            ],
            axis=0,
        )
        dist = pdist(features, metric="euclidean")
        hierarchy = linkage(dist, method="average")
        labels = fcluster(hierarchy, t=tau2, criterion="distance") - 1
        for cluster_id in sorted(set(labels.tolist())):
            members = [keyless[i] for i, lab in enumerate(labels) if lab == cluster_id]
            supporting_docs = {doc_id for doc_id, _ in members}
            if len(supporting_docs) / doc_count < phi:
                continue
            ent = members[0][1].value_entity
            if ent < 0:
                continue
            name = f"ent_{ent}"
            confidence = min(1.0, label_confidence * (len(supporting_docs) / doc_count))
            if confidence < abstain:
                continue
            discovered.append(
                DiscoveredField(
                    field_key=_slug(name),
                    display_name=name,
                    confidence=confidence,
                    kind="entity_cluster",
                )
            )
    return discovered
