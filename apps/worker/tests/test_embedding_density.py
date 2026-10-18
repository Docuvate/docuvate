# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import numpy as np

from docuvate_worker.application.embedding_density import (
    classify_embedding,
    model_from_state,
    model_to_state,
    record_correction,
    run_calibration,
    train_from_labeled_examples,
)
from docuvate_worker.domain.embedding_density.calibration import (
    CalibrationThreshold,
    clopper_pearson_lower_bound,
    expected_calibration_error,
    fit_temperature_and_bias,
    learn_then_test_threshold,
    posterior_log_odds,
    softmax,
    split_embedding_density_documents,
)
from docuvate_worker.domain.embedding_density.constants import COARSE_TOP_GROUP_TARGET_ID
from docuvate_worker.domain.embedding_density.kernel import (
    KERNEL_REGULARIZER_LAMBDA,
    KernelCorrector,
    correction_log_odds_targets,
    rbf_kernel,
)
from docuvate_worker.domain.embedding_density.model import EmbeddingDensityModel
from docuvate_worker.domain.embedding_density.niw import NiwClassStats, class_log_predictive, default_hyperparameters
from docuvate_worker.domain.embedding_density.schemas import EmbeddingDensityStatePayload


def _separated_clusters(
    rng: np.random.Generator,
    *,
    dim: int,
    per_class: int,
    separation: float,
    doc_prefix: str,
) -> tuple[np.ndarray, np.ndarray, list[str], list[str]]:
    labels = ["a", "b", "c"]
    vectors: list[np.ndarray] = []
    y: list[str] = []
    doc_ids: list[str] = []
    for i, lid in enumerate(labels):
        center = np.zeros(dim, dtype=np.float64)
        center[i % dim] = separation * (i + 1)
        for j in range(per_class):
            doc = f"{doc_prefix}-{lid}-{j}"
            vectors.append(center + rng.normal(0, 0.12, size=dim))
            y.append(lid)
            doc_ids.append(doc)
    return np.stack(vectors), np.array(y), labels, doc_ids


def test_niw_predictive_increases_near_mean() -> None:
    dim = 6
    hyper = default_hyperparameters(dim)
    stats = NiwClassStats.empty(dim)
    mean = np.ones(dim)
    for _ in range(40):
        stats.add(mean + np.random.default_rng(0).normal(0, 0.1, size=dim))
    near = class_log_predictive(mean, stats, hyper)
    far = class_log_predictive(mean + 5.0, stats, hyper)
    assert near > far


def test_temperature_bias_grid_newton_lowers_ece() -> None:
    rng = np.random.default_rng(1)
    logits = rng.normal(0, 1.2, size=(800, 4))
    labels = rng.integers(0, 4, size=800)
    overconfident = logits * 10.0
    ece_before = expected_calibration_error(overconfident, labels, 1.0, np.zeros(4))
    temperature, bias = fit_temperature_and_bias(overconfident, labels)
    ece_after = expected_calibration_error(overconfident, labels, temperature, bias)
    assert ece_before > 0.05
    assert ece_after < ece_before


def test_clopper_pearson_exact_conservative() -> None:
    lb = clopper_pearson_lower_bound(99, 100, 0.005)
    assert lb < 0.99
    assert lb > 0.9


def test_kernel_schur_matches_batch_inverse_with_regularizer() -> None:
    rng = np.random.default_rng(2)
    points = [rng.normal(size=5) for _ in range(4)]
    offsets = [rng.normal(size=3) for _ in range(4)]
    incremental = KernelCorrector(bandwidth=0.5)
    for p, o in zip(points, offsets, strict=True):
        incremental.add_correction(p, o)
    batch = KernelCorrector(bandwidth=0.5)
    batch.points = [np.array(p) for p in points]
    batch.label_offsets = [np.array(o) for o in offsets]
    batch.gram_inverse = np.linalg.inv(batch._gram_matrix())
    assert np.allclose(incremental.gram_inverse, batch.gram_inverse, atol=1e-7)


def test_near_duplicate_corrections_stable() -> None:
    rng = np.random.default_rng(3)
    base = rng.normal(size=8)
    model = EmbeddingDensityModel(label_ids=["x", "y"], dim=8)
    for _ in range(30):
        model.add_training_example("x", base + rng.normal(0, 0.05, size=8))
        model.add_training_example("y", base + rng.normal(0, 0.05, size=8) + np.array([0.3, 0, 0, 0, 0, 0, 0, 0]))
    p1 = base + rng.normal(0, 1e-4, size=8)
    p2 = base + rng.normal(0, 2e-4, size=8)
    model.apply_correction(p1, "x")
    model.apply_correction(p2, "y")
    delta = model.kernel.log_odds_delta(base, 2)
    assert np.all(np.abs(delta) < 50.0)


def test_correction_log_odds_target_one_rises_and_wins() -> None:
    log_odds = np.array([3.0, 0.0, -1.0], dtype=np.float64)
    targets = correction_log_odds_targets(log_odds, 1)
    corrected = log_odds + targets
    assert int(np.argmax(corrected)) == 1
    assert corrected[1] > log_odds[1]


def test_correction_margin_rule_fixes_target() -> None:
    dim = 4
    model = EmbeddingDensityModel(label_ids=["x", "y"], dim=dim)
    point = np.array([1.0, 0.0, 0.0, 0.0])
    model.add_training_example("x", point + np.array([0.15, 0, 0, 0]))
    model.add_training_example("y", point + np.array([-0.15, 0, 0, 0]))
    before = model.posterior(point)[0]
    assert before[0] >= before[1]
    model.apply_correction(point, "x")
    after = model.posterior(point)[0]
    assert after[0] > after[1]
    assert after[0] > before[0]


def test_independent_coarse_and_fine_tiers() -> None:
    model = EmbeddingDensityModel(label_ids=["a", "b"], dim=2)
    model.add_training_example("a", np.array([2.0, 0.0]))
    model.add_training_example("b", np.array([-2.0, 0.0]))
    model.coarse_ready = True
    model.fine_ready = {"a": True, "b": False}
    model.label_to_group = {"a": "g", "b": "g"}
    log_odds_thr = posterior_log_odds(0.4)
    model.coarse_thresholds[COARSE_TOP_GROUP_TARGET_ID] = CalibrationThreshold(
        scope="coarse",
        target_id=COARSE_TOP_GROUP_TARGET_ID,
        threshold=log_odds_thr,
        lower_bound=0.99,
        coverage=0.5,
    )
    model.fine_thresholds["a"] = CalibrationThreshold(
        scope="fine",
        target_id="a",
        threshold=log_odds_thr,
        lower_bound=0.95,
        coverage=0.5,
    )
    model.novelty_threshold = float("-inf")
    out = model.classify(np.array([2.0, 0.0]))
    assert out.tier.value == "auto_apply"
    assert out.confirm_label_id == "a"


def test_fine_confirm_when_only_fine_ready() -> None:
    model = EmbeddingDensityModel(label_ids=["a", "b"], dim=2)
    model.add_training_example("a", np.array([2.0, 0.0]))
    model.add_training_example("b", np.array([-2.0, 0.0]))
    model.coarse_ready = False
    model.fine_ready = {"a": True, "b": False}
    log_odds_thr = posterior_log_odds(0.4)
    model.fine_thresholds["a"] = CalibrationThreshold(
        scope="fine",
        target_id="a",
        threshold=log_odds_thr,
        lower_bound=0.95,
        coverage=0.5,
    )
    model.coarse_thresholds[COARSE_TOP_GROUP_TARGET_ID] = CalibrationThreshold(
        scope="coarse",
        target_id=COARSE_TOP_GROUP_TARGET_ID,
        threshold=log_odds_thr,
        lower_bound=0.99,
        coverage=0.5,
    )
    model.novelty_threshold = float("-inf")
    out = model.classify(np.array([2.0, 0.0]))
    assert out.tier.value == "confirm"
    assert out.label_id == "a"


def test_coarse_auto_apply_blocked_when_coarse_not_ready() -> None:
    model = EmbeddingDensityModel(label_ids=["a", "b"], dim=2)
    model.add_training_example("a", np.array([2.0, 0.0]))
    model.add_training_example("b", np.array([-2.0, 0.0]))
    model.coarse_ready = False
    model.fine_ready = {"a": False, "b": False}
    model.coarse_thresholds[COARSE_TOP_GROUP_TARGET_ID] = CalibrationThreshold(
        scope="coarse",
        target_id=COARSE_TOP_GROUP_TARGET_ID,
        threshold=float("-inf"),
        lower_bound=0.99,
        coverage=1.0,
    )
    model.novelty_threshold = float("-inf")
    out = model.classify(np.array([2.0, 0.0]))
    assert out.tier.value != "auto_apply"


def test_learn_then_test_picks_largest_passing_coverage() -> None:
    scores = np.linspace(0.99, 0.5, 200)
    correct = np.ones(200, dtype=np.bool_)
    thr = learn_then_test_threshold(
        scores,
        correct,
        target_precision=0.95,
        delta=0.05,
        scope="coarse",
        target_id="g",
    )
    assert thr is not None
    assert thr.coverage >= 0.4


def test_fit_calibration_requires_document_ids() -> None:
    model = EmbeddingDensityModel(label_ids=["a", "b"], dim=2)
    vectors = np.array([[1.0, 0.0], [-1.0, 0.0]], dtype=np.float64)
    labels = np.array([0, 1], dtype=np.int64)
    try:
        model.fit_calibration(vectors, labels, document_ids=None)
        raised = False
    except ValueError:
        raised = True
    assert raised


def test_kernel_cross_org_strength_zero_isolates_corrections() -> None:
    kernel = KernelCorrector(cross_org_strength=0.0)
    point = np.array([0.2, 0.1, 0.0])
    offsets = np.array([1.0, -1.0])
    kernel.add_correction(point, offsets, organization_id="org-a")
    delta_other = kernel.log_odds_delta(point, 2, organization_id="org-b")
    delta_same = kernel.log_odds_delta(point, 2, organization_id="org-a")
    assert np.allclose(delta_other, 0.0)
    assert not np.allclose(delta_same, 0.0)


def test_coarse_tier_certifies_with_nonzero_coverage() -> None:
    from docuvate_worker.domain.embedding_density import calibration as cal_mod

    rng = np.random.default_rng(7)
    dim = 8
    train_x, train_y, label_ids, train_docs = _separated_clusters(
        rng, dim=dim, per_class=900, separation=6.5, doc_prefix="coarse"
    )
    state = train_from_labeled_examples(label_ids, train_x.tolist(), train_y.tolist())
    calibrated = run_calibration(
        state,
        train_x.tolist(),
        train_y.tolist(),
        delta=0.05,
        document_ids=train_docs,
    )
    model = model_from_state(
        EmbeddingDensityStatePayload.model_validate(calibrated.model_dump(exclude={"metrics"}))
    )
    coarse = model.coarse_thresholds.get(COARSE_TOP_GROUP_TARGET_ID)
    assert coarse is not None
    assert coarse.coverage > 0.0
    assert coarse.threshold < 50.0
    assert calibrated.metrics is not None
    assert calibrated.metrics.coarse_accepted_blocks > 0
    assert model.coarse_ready


def test_synthetic_eval_held_out_certified_tiers() -> None:
    from docuvate_worker.domain.embedding_density import calibration as cal_mod

    rng = np.random.default_rng(42)
    dim = 8
    train_x, train_y, label_ids, train_docs = _separated_clusters(
        rng, dim=dim, per_class=900, separation=6.5, doc_prefix="train"
    )
    state = train_from_labeled_examples(label_ids, train_x.tolist(), train_y.tolist())
    model = model_from_state(state)
    calibrated = run_calibration(
        model_to_state(model),
        train_x.tolist(),
        train_y.tolist(),
        delta=0.05,
        document_ids=train_docs,
    )
    state = EmbeddingDensityStatePayload.model_validate(calibrated.model_dump(exclude={"metrics"}))
    model = model_from_state(state)
    assert model.coarse_ready
    assert any(model.fine_ready.values())
    assert model.coarse_thresholds.get(COARSE_TOP_GROUP_TARGET_ID) is not None
    assert model.fine_thresholds

    doc_split = split_embedding_density_documents(train_docs, rng=np.random.default_rng(0))
    assert doc_split.test_indices.size > 0

    coarse_correct = 0
    coarse_total = 0
    fine_correct = 0
    fine_total = 0
    for idx in doc_split.test_indices:
        row = train_x[idx]
        label = train_y[idx]
        result = classify_embedding(state, row.tolist())
        if result.decision_tier == "auto_apply":
            coarse_total += 1
            if result.label_id == label:
                coarse_correct += 1
        if result.confirm_label_id is not None:
            fine_total += 1
            if result.confirm_label_id == label:
                fine_correct += 1
        elif result.decision_tier == "confirm" and result.label_id:
            fine_total += 1
            if result.label_id == label:
                fine_correct += 1

    assert coarse_total > 0
    assert coarse_correct / coarse_total >= 0.99
    assert fine_total > 0
    assert fine_correct / fine_total >= 0.95


def test_fine_ready_before_coarse_on_moderate_separation() -> None:
    rng = np.random.default_rng(11)
    dim = 8
    train_x, train_y, label_ids, train_docs = _separated_clusters(
        rng, dim=dim, per_class=600, separation=3.5, doc_prefix="split-ready"
    )
    state = train_from_labeled_examples(label_ids, train_x.tolist(), train_y.tolist())
    calibrated = run_calibration(
        state,
        train_x.tolist(),
        train_y.tolist(),
        delta=0.05,
        document_ids=train_docs,
    )
    model = model_from_state(
        EmbeddingDensityStatePayload.model_validate(calibrated.model_dump(exclude={"metrics"}))
    )
    assert not model.coarse_ready
    assert any(model.fine_ready.values())
    state_payload = EmbeddingDensityStatePayload.model_validate(
        calibrated.model_dump(exclude={"metrics"})
    )
    confirms = 0
    auto_applies = 0
    for row in train_x[:40]:
        result = classify_embedding(state_payload, row.tolist())
        if result.decision_tier == "confirm":
            confirms += 1
        if result.decision_tier == "auto_apply":
            auto_applies += 1
    assert confirms > 0
    assert auto_applies == 0


def test_record_correction_roundtrip_state() -> None:
    state = train_from_labeled_examples(
        ["a", "b"],
        [[0.0, 0.0], [1.0, 1.0]],
        ["a", "b"],
    )
    updated = record_correction(state, [0.05, 0.02], "a")
    model = model_from_state(updated)
    assert len(model.kernel.points) == 1
