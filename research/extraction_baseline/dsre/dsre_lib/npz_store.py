# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np


@dataclass
class DsreNpz:
    schema_vec: np.ndarray
    span_vec: np.ndarray
    layout: np.ndarray
    offsets: np.ndarray
    gold: np.ndarray
    split: np.ndarray
    family: np.ndarray
    field_type: np.ndarray
    field_key: np.ndarray
    field_absent: np.ndarray
    doc_id: np.ndarray
    candidate_text: np.ndarray
    episode_doc: np.ndarray

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        np.savez_compressed(
            path,
            schema_vec=self.schema_vec,
            span_vec=self.span_vec,
            layout=self.layout,
            offsets=self.offsets,
            gold=self.gold,
            split=self.split,
            family=self.family,
            field_type=self.field_type,
            field_key=self.field_key,
            field_absent=self.field_absent.astype(np.int8),
            doc_id=self.doc_id,
            candidate_text=self.candidate_text,
            episode_doc=self.episode_doc,
            allow_pickle=False,
        )

    @staticmethod
    def load(path: Path) -> DsreNpz:
        with np.load(path, allow_pickle=False) as data:
            episode_doc = data["episode_doc"] if "episode_doc" in data else np.zeros(len(data["gold"]))
            return DsreNpz(
                schema_vec=data["schema_vec"],
                span_vec=data["span_vec"],
                layout=data["layout"],
                offsets=data["offsets"],
                gold=data["gold"],
                split=data["split"],
                family=data["family"],
                field_type=data["field_type"],
                field_key=data["field_key"],
                field_absent=data["field_absent"].astype(bool),
                doc_id=data["doc_id"],
                candidate_text=data["candidate_text"],
                episode_doc=episode_doc,
            )
