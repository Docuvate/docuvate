# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import random
from collections import defaultdict

from dsre_lib.constants import SPLIT_CAL, SPLIT_CONFIRM, SPLIT_TEST, SPLIT_TRAIN


def assign_splits(
    doc_split_names: list[str],
    family_ids: list[int],
    *,
    seed: int = 42,
) -> list[int]:
    """Map each document to train/cal/confirm/test split codes."""
    assert len(doc_split_names) == len(family_ids)
    test_families = {fam for split, fam in zip(doc_split_names, family_ids, strict=True) if split == "test"}

    family_to_split: dict[int, int] = {}
    for fam in test_families:
        family_to_split[fam] = SPLIT_TEST

    pool_families = sorted(
        {fam for split, fam in zip(doc_split_names, family_ids, strict=True) if split != "test" and fam not in test_families}
    )
    rng = random.Random(seed)
    rng.shuffle(pool_families)
    n = len(pool_families)
    n_train = int(round(n * 0.7))
    n_cal = int(round(n * 0.15))
    n_confirm = max(0, n - n_train - n_cal)
    for fam in pool_families[:n_train]:
        family_to_split[fam] = SPLIT_TRAIN
    for fam in pool_families[n_train : n_train + n_cal]:
        family_to_split[fam] = SPLIT_CAL
    for fam in pool_families[n_train + n_cal : n_train + n_cal + n_confirm]:
        family_to_split[fam] = SPLIT_CONFIRM

    out: list[int] = []
    for split_name, fam in zip(doc_split_names, family_ids, strict=True):
        if split_name == "test":
            out.append(SPLIT_TEST)
            continue
        out.append(family_to_split.get(fam, SPLIT_TRAIN))
    return out


def assert_families_do_not_cross_splits(split_codes: list[int], family_ids: list[int]) -> dict[int, set[int]]:
    by_family: dict[int, set[int]] = defaultdict(set)
    for fam, code in zip(family_ids, split_codes, strict=True):
        by_family[fam].add(code)
    violations = {fam: splits for fam, splits in by_family.items() if len(splits) > 1}
    if violations:
        msg = f"family split violations: {len(violations)} families cross splits"
        raise AssertionError(msg)
    return by_family
