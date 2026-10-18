#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Bucket frozen-eval vendor false negatives by abstention cause."""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO_ROOT / "apps/worker/scripts"))

from docuvate_worker.infrastructure.ml.value_types.field_confidence_calibration import (
    get_field_confidence_calibration,
)
from docuvate_worker.infrastructure.ml.value_types.field_suggestions import (
    _collect_vendor_candidates,
    _extract_vendor,
    _has_sender_evidence,
    _is_heading_like,
    _is_invoice_banner,
    _split_label_value,
    learned_field_suggestions,
    peek_vendor_promotion_candidate,
)
from docuvate_worker.infrastructure.ml.value_types.registry import get_value_type_models
from docuvate_worker.infrastructure.ml.value_types.sender_line_e5 import sender_lines_e5_cosine
from docuvate_worker.infrastructure.ml.value_types.vendor_document_layout import (
    footer_band_ratio,
    letterhead_band_ratio,
)
from docuvate_worker.infrastructure.ml.value_types.vendor_line_ranker import get_vendor_line_ranker
from docuvate_worker.infrastructure.ml.value_types.vendor_role_line_e5 import (
    doc_heading_lines_e5_cosine,
    recipient_lines_e5_cosine,
    supplier_lines_e5_cosine,
)

FROZEN = REPO_ROOT / "apps/worker/tests/fixtures/global_field_holdout_frozen_eval.v1.json"


def _norm(value: str) -> str:
    return value.strip().lower()


def _matches_gt(candidate: str, gt: str) -> bool:
    c, g = _norm(candidate), _norm(gt)
    return c == g or g in c or c in g


def _enumerate_raw_candidates(text: str, bundle) -> list[tuple[int, str, bool, str]]:
    """Returns (line_index, candidate, had_label, reject_reason|ok)."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    sender_cosines = sender_lines_e5_cosine(lines)
    rows: list[tuple[int, str, bool, str]] = []
    for index, line in enumerate(lines):
        _, value_part = _split_label_value(line)
        had_label = value_part is not None
        candidate = value_part if value_part is not None else line.strip()
        if not candidate:
            rows.append((index, "", had_label, "empty"))
            continue
        if _is_heading_like(candidate, bundle):
            rows.append((index, candidate, had_label, "heading_like"))
            continue
        if not had_label and len(candidate.split()) >= 9:  # noqa: PLR2004
            rows.append((index, candidate, had_label, "too_long_unlabeled"))
            continue
        if _is_invoice_banner(candidate):
            rows.append((index, candidate, had_label, "invoice_banner"))
            continue
        money_score = bundle.log_likelihood(candidate, "money")
        org_score = bundle.log_likelihood(candidate, "organization")
        if money_score >= org_score and not had_label:
            rows.append((index, candidate, had_label, "money_beats_org"))
            continue
        if not _has_sender_evidence(
            lines,
            index,
            candidate,
            bundle,
            had_explicit_label=had_label,
            sender_e5_cosine=sender_cosines[index],
        ):
            rows.append((index, candidate, had_label, "no_sender_evidence"))
            continue
        free_score = bundle.log_likelihood(candidate, "free_text")
        if org_score <= free_score:
            rows.append((index, candidate, had_label, "org_le_free"))
            continue
        if org_score - free_score <= 0.5 and not had_label:  # noqa: PLR2004
            rows.append((index, candidate, had_label, "low_org_margin"))
            continue
        rows.append((index, candidate, had_label, "ok"))
    return rows


def _would_recipient_filter_drop(
    text: str, gt: str, bundle
) -> bool:
    """Whether a labeled recipient-dominant line would be excluded by recipient>supplier E5."""
    candidates = _collect_vendor_candidates(text, bundle)
    if not candidates:
        return False
    gt_rows = [row for row in candidates if _matches_gt(row.value, gt)]
    if not gt_rows:
        return False
    best_score = max(row.ranker_score for row in candidates)
    shortlist = [row for row in candidates if row.ranker_score >= best_score - 0.06]
    gt_in_shortlist = any(row in shortlist for row in gt_rows)
    if not gt_in_shortlist:
        return False
    return any(
        row.had_explicit_label and row.recipient_e5_cosine > row.supplier_e5_cosine
        for row in shortlist
        if _matches_gt(row.value, gt)
    )


def _bucket_fn(text: str, gt: str, bundle) -> str:
    pred = {f.key: f.value for f in learned_field_suggestions(text)}
    if pred.get("vendor") == gt:
        return "not_fn"

    raw = _enumerate_raw_candidates(text, bundle)
    gt_rows = [(i, c, hl, r) for i, c, hl, r in raw if c and _matches_gt(c, gt)]
    if not gt_rows:
        return "correct_line_not_labeled_or_missing"

    gt_ok = [(i, c, hl) for i, c, hl, r in gt_rows if r == "ok"]
    if not gt_ok:
        _, _, had_label, reason = gt_rows[0]
        if not had_label and reason in {
            "no_sender_evidence",
            "low_org_margin",
            "money_beats_org",
            "org_le_free",
        }:
            line_index = gt_rows[0][0]
            lines = [line.strip() for line in text.splitlines() if line.strip()]
            if letterhead_band_ratio(line_index, len(lines)) >= 0.5:
                return "correct_line_unlabeled_letterhead"
            if footer_band_ratio(line_index, len(lines)) >= 0.5:
                return "correct_line_unlabeled_footer"
        return f"gt_never_candidate:{reason}"

    candidates = _collect_vendor_candidates(text, bundle)
    gt_in_pool = [row for row in candidates if _matches_gt(row.value, gt)]
    if not gt_in_pool:
        return "no_candidate_in_shortlist"

    if _would_recipient_filter_drop(text, gt, bundle):
        return "dropped_by_recipient_supplier_filter"

    peek = peek_vendor_promotion_candidate(text, bundle)
    if peek is None:
        return "no_candidate_in_shortlist"

    if not _matches_gt(peek.value, gt):
        return "wrong_line_ranked_higher"

    row = _extract_vendor(text, bundle)
    if row is None:
        ranker = get_vendor_line_ranker()
        cal = get_field_confidence_calibration()
        min_score = ranker.min_score_for(
            had_explicit_label=peek.had_explicit_label,
            sender_e5_cosine=peek.sender_e5_cosine,
            sender_e5_floor=cal.vendor_min_sender_e5_cosine,
        )
        if peek.ranker_score + 1e-9 < min_score:
            return "ranker_min_below_gate"
        vendor_org = bundle.log_likelihood(peek.value, "organization")
        vendor_free = bundle.log_likelihood(peek.value, "free_text")
        vendor_addr = bundle.log_likelihood(peek.value, "address")
        vendor_id = bundle.log_likelihood(peek.value, "identifier")
        ok, _prob = cal.vendor_meets_auto_promote_gate(
            org_score=vendor_org,
            free_score=vendor_free,
            addr_score=vendor_addr,
            id_score=vendor_id,
            had_explicit_label=peek.had_explicit_label,
            sender_e5_cosine=peek.sender_e5_cosine,
            ranker_score=peek.ranker_score,
            recipient_e5_cosine=peek.recipient_e5_cosine,
            supplier_e5_cosine=peek.supplier_e5_cosine,
            doc_heading_e5_cosine=peek.doc_heading_e5_cosine,
        )
        if not ok:
            return "probability_just_under_gate"
        return "ranker_min_unknown"

    return "unexpected"


def main() -> None:
    docs = json.loads(FROZEN.read_text(encoding="utf-8"))["documents"]
    bundle = get_value_type_models()
    buckets: Counter[str] = Counter()
    examples: dict[str, list[str]] = {}
    for doc in docs:
        gt = doc.get("expected", {}).get("vendor")
        if not isinstance(gt, str):
            continue
        text = str(doc["text"])
        pred = {f.key: f.value for f in learned_field_suggestions(text)}
        if pred.get("vendor") == gt:
            continue
        bucket = _bucket_fn(text, gt, bundle)
        buckets[bucket] += 1
        examples.setdefault(bucket, [])
        if len(examples[bucket]) < 3:
            examples[bucket].append(str(doc.get("id", "")))

    summary = {
        "frozen_seed": json.loads(FROZEN.read_text(encoding="utf-8")).get("frozen_seed"),
        "fn_total": sum(buckets.values()),
        "buckets": dict(buckets),
        "examples": examples,
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
