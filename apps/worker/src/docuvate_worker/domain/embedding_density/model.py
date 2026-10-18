# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Embedding-density classifier: NIW likelihoods, calibration, kernel corrections, decisions."""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from numpy.typing import NDArray

from docuvate_worker.domain.embedding_density.calibration import (
    CalibrationThreshold,
    coarse_calibration_ready,
    fine_label_calibration_ready,
    fit_temperature_and_bias,
    learn_then_test_threshold,
    posterior_log_odds,
    softmax,
    split_embedding_density_documents,
)
from docuvate_worker.domain.embedding_density.constants import COARSE_TOP_GROUP_TARGET_ID
from docuvate_worker.domain.embedding_density.content_space import (
    LabelContentMeasure,
    compute_label_content_measures,
)
from docuvate_worker.domain.embedding_density.decision import (
    DecisionOutcome,
    decide_document,
    top_group_mass_and_id,
)
from docuvate_worker.domain.embedding_density.kernel import (
    KernelCorrector,
    correction_log_odds_targets,
)
from docuvate_worker.domain.embedding_density.niw import (
    NiwClassStats,
    NiwHyperparameters,
    class_log_predictive,
    default_hyperparameters,
)
from docuvate_worker.domain.embedding_density.novelty import fit_novelty_threshold
from docuvate_worker.domain.embedding_density.structure_bank import StructureBank


def _empty_class_stats() -> dict[str, NiwClassStats]:
    return {}


def _empty_log_priors() -> dict[str, float]:
    return {}


def _empty_calibration_thresholds() -> dict[str, CalibrationThreshold]:
    return {}


def _empty_label_groups() -> dict[str, str]:
    return {}


@dataclass
class EmbeddingDensityModel:
    label_ids: list[str]
    dim: int
    hyper: NiwHyperparameters = field(default_factory=lambda: default_hyperparameters(1))
    class_stats: dict[str, NiwClassStats] = field(default_factory=_empty_class_stats)
    log_priors: dict[str, float] = field(default_factory=_empty_log_priors)
    temperature: float = 1.0
    class_bias: NDArray[np.float64] | None = None
    kernel: KernelCorrector = field(default_factory=KernelCorrector)
    structure_bank: StructureBank = field(default_factory=StructureBank)
    novelty_threshold: float = float("-inf")
    coarse_thresholds: dict[str, CalibrationThreshold] = field(
        default_factory=_empty_calibration_thresholds
    )
    fine_thresholds: dict[str, CalibrationThreshold] = field(
        default_factory=_empty_calibration_thresholds
    )
    label_to_group: dict[str, str] = field(default_factory=_empty_label_groups)
    coarse_ready: bool = False
    fine_ready: dict[str, bool] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.hyper.mu0.shape[0] != self.dim:
            self.hyper = default_hyperparameters(self.dim)
        for lid in self.label_ids:
            self.class_stats.setdefault(lid, NiwClassStats.empty(self.dim))
            self.log_priors.setdefault(lid, -np.log(max(len(self.label_ids), 1)))
        if self.class_bias is None:
            self.class_bias = np.zeros(len(self.label_ids), dtype=np.float64)

    def _index(self, label_id: str) -> int:
        return self.label_ids.index(label_id)

    def add_training_example(self, label_id: str, vector: NDArray[np.float64]) -> None:
        if label_id not in self.class_stats:
            self.class_stats[label_id] = NiwClassStats.empty(self.dim)
            self.label_ids.append(label_id)
            self.class_bias = np.zeros(len(self.label_ids), dtype=np.float64)
        self.class_stats[label_id].add(vector)

    def seed_new_label(
        self,
        label_id: str,
        exemplars: list[NDArray[np.float64]],
    ) -> None:
        others = {lid: st for lid, st in self.class_stats.items() if lid != label_id}
        stats = self.structure_bank.prior_stats_for_new_class(
            exemplars,
            self.dim,
            other_class_stats=others,
        )
        self.class_stats[label_id] = stats
        if label_id not in self.label_ids:
            self.label_ids.append(label_id)
            self.class_bias = np.zeros(len(self.label_ids), dtype=np.float64)

    def _log_likelihoods(self, x: NDArray[np.float64]) -> NDArray[np.float64]:
        logits = np.zeros(len(self.label_ids), dtype=np.float64)
        for i, lid in enumerate(self.label_ids):
            logits[i] = class_log_predictive(x, self.class_stats[lid], self.hyper)
        return logits

    def _log_joint(self, x: NDArray[np.float64]) -> tuple[NDArray[np.float64], float]:
        logits = self._log_likelihoods(x)
        log_priors = np.array([self.log_priors[lid] for lid in self.label_ids], dtype=np.float64)
        log_joint = logits + log_priors
        log_px = float(np.logaddexp.reduce(log_joint))
        return log_joint, log_px

    def posterior(self, x: NDArray[np.float64]) -> tuple[NDArray[np.float64], float]:
        log_joint, log_px = self._log_joint(x)
        logits = log_joint - log_px
        if self.class_bias is not None:
            logits = logits / max(self.temperature, 1e-6) + self.class_bias
        delta = self.kernel.log_odds_delta(x, len(self.label_ids))
        logits = logits + delta
        probs = softmax(logits)
        return probs, log_px

    def apply_correction(
        self,
        point: NDArray[np.float64],
        target_label_id: str,
        *,
        strength: float = 4.0,
    ) -> None:
        del strength
        x = np.asarray(point, dtype=np.float64).reshape(-1)
        log_joint, log_px = self._log_joint(x)
        logits = log_joint - log_px
        if self.class_bias is not None:
            logits = logits / max(self.temperature, 1e-6) + self.class_bias
        targets = correction_log_odds_targets(logits, self._index(target_label_id))
        self.kernel.add_correction(x, targets)

    def _calibration_logits(
        self, vectors: NDArray[np.float64]
    ) -> tuple[NDArray[np.float64], NDArray[np.float64]]:
        logits = np.zeros((vectors.shape[0], len(self.label_ids)), dtype=np.float64)
        log_px_list: list[float] = []
        for i, row in enumerate(vectors):
            ll = self._log_likelihoods(row)
            log_priors = np.array(
                [self.log_priors[lid] for lid in self.label_ids],
                dtype=np.float64,
            )
            log_joint = ll + log_priors
            log_px_list.append(float(np.logaddexp.reduce(log_joint)))
            logits[i] = log_joint - log_px_list[-1]
        return logits, np.array(log_px_list, dtype=np.float64)

    def _retrain_niw_on_subset(
        self,
        vectors: NDArray[np.float64],
        labels: NDArray[np.int64],
    ) -> None:
        for lid in self.label_ids:
            self.class_stats[lid] = NiwClassStats.empty(self.dim)
        counts: dict[str, int] = {lid: 0 for lid in self.label_ids}
        for i, row in enumerate(vectors):
            lid = self.label_ids[int(labels[i])]
            self.class_stats[lid].add(row)
            counts[lid] = counts.get(lid, 0) + 1
        total = max(sum(counts.values()), 1)
        for lid in self.label_ids:
            c = counts.get(lid, 0)
            self.log_priors[lid] = float(np.log(max(c, 1) / total))

    def fit_calibration(
        self,
        vectors: NDArray[np.float64],
        labels: NDArray[np.int64],
        *,
        delta: float = 0.05,
        document_ids: list[str] | None = None,
        rng: np.random.Generator | None = None,
    ) -> dict[str, float]:
        if rng is None:
            rng = np.random.default_rng(0)
        if document_ids is None or len(document_ids) != vectors.shape[0]:
            raise ValueError(
                "document_ids required with one id per training vector for held-out calibration"
            )

        split = split_embedding_density_documents(document_ids, rng=rng)
        if (
            split.train_indices.size == 0
            or split.selection_indices.size == 0
            or split.certification_indices.size == 0
        ):
            self.coarse_ready = False
            self.fine_ready = {}
            return {
                "coarse_accepted_blocks": 0.0,
                "fine_labels_calibrated": 0.0,
                "coarse_ready": 0.0,
                "fine_ready_labels": 0.0,
            }

        train_vectors = vectors[split.train_indices]
        train_labels = labels[split.train_indices]
        self._retrain_niw_on_subset(train_vectors, train_labels)

        selection_vectors = vectors[split.selection_indices]
        selection_labels = labels[split.selection_indices]
        cert_vectors = vectors[split.certification_indices]
        cert_labels = labels[split.certification_indices]
        if selection_vectors.shape[0] == 0 or cert_vectors.shape[0] == 0:
            self.coarse_ready = False
            self.fine_ready = {}
            return {
                "coarse_accepted_blocks": 0.0,
                "fine_labels_calibrated": 0.0,
                "coarse_ready": 0.0,
                "fine_ready_labels": 0.0,
            }

        selection_logits, _ = self._calibration_logits(selection_vectors)
        self.temperature, self.class_bias = fit_temperature_and_bias(
            selection_logits, selection_labels
        )
        _, cert_log_px = self._calibration_logits(cert_vectors)
        self.novelty_threshold = fit_novelty_threshold(cert_log_px, alpha=0.01)
        coarse_accepted = 0
        fine_counts: dict[str, int] = {}
        self.coarse_thresholds.clear()
        self.fine_thresholds.clear()

        # Default groups: each label is its own group until clustering is supplied.
        for lid in self.label_ids:
            self.label_to_group.setdefault(lid, lid)

        coarse_scores: list[float] = []
        coarse_correct: list[bool] = []
        label_scores: dict[str, list[tuple[float, bool]]] = {lid: [] for lid in self.label_ids}

        for i, row in enumerate(cert_vectors):
            probs, _ = self.posterior(row)
            y = int(cert_labels[i])
            true_gid = self.label_to_group[self.label_ids[y]]
            top_mass, top_gid = top_group_mass_and_id(probs, self.label_ids, self.label_to_group)
            coarse_scores.append(posterior_log_odds(top_mass))
            coarse_correct.append(top_gid == true_gid)
            for idx, lid in enumerate(self.label_ids):
                label_scores[lid].append((posterior_log_odds(float(probs[idx])), idx == y))

        coarse_score_arr = np.array(coarse_scores, dtype=np.float64)
        coarse_corr_arr = np.array(coarse_correct, dtype=np.bool_)
        coarse_thr = learn_then_test_threshold(
            coarse_score_arr,
            coarse_corr_arr,
            target_precision=0.99,
            delta=delta,
            scope="coarse",
            target_id=COARSE_TOP_GROUP_TARGET_ID,
        )
        coarse_certified = coarse_thr is not None
        if coarse_thr is not None:
            self.coarse_thresholds[COARSE_TOP_GROUP_TARGET_ID] = coarse_thr
            coarse_accepted = int(np.sum(coarse_score_arr >= coarse_thr.threshold))

        for lid, pairs in label_scores.items():
            scores = np.array([p[0] for p in pairs], dtype=np.float64)
            corr = np.array([p[1] for p in pairs], dtype=np.bool_)
            thr = learn_then_test_threshold(
                scores,
                corr,
                target_precision=0.95,
                delta=delta,
                scope="fine",
                target_id=lid,
            )
            if thr is not None:
                self.fine_thresholds[lid] = thr
                fine_counts[lid] = int(np.sum(scores >= thr.threshold))

        self.coarse_ready = coarse_calibration_ready(coarse_accepted, coarse_certified)
        self.fine_ready = {
            lid: fine_label_calibration_ready(fine_counts.get(lid, 0), lid in self.fine_thresholds)
            for lid in self.label_ids
        }
        fine_ready_count = sum(1 for ready in self.fine_ready.values() if ready)
        return {
            "coarse_accepted_blocks": float(coarse_accepted),
            "fine_labels_calibrated": float(len(self.fine_thresholds)),
            "coarse_ready": float(self.coarse_ready),
            "fine_ready_labels": float(fine_ready_count),
        }

    def classify(self, x: NDArray[np.float64]) -> DecisionOutcome:
        probs, log_px = self.posterior(x)
        return decide_document(
            label_ids=self.label_ids,
            posterior=probs,
            log_px=log_px,
            novelty_threshold=self.novelty_threshold,
            coarse_thresholds=self.coarse_thresholds,
            fine_thresholds=self.fine_thresholds,
            label_to_group=self.label_to_group,
            coarse_ready=self.coarse_ready,
            fine_ready=self.fine_ready,
        )

    def content_measures(self) -> list[LabelContentMeasure]:
        priors = np.array(
            [np.exp(self.log_priors[lid]) for lid in self.label_ids],
            dtype=np.float64,
        )
        priors = priors / np.sum(priors)
        return compute_label_content_measures(self.label_ids, self.class_stats, self.hyper, priors)
