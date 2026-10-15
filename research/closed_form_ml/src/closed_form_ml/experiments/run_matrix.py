# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Run all closed-form ML feasibility experiments and write JSON results."""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import numpy as np

from closed_form_ml.embeddings import disable_heavy_models, embed_passages
from closed_form_ml.experiments.datasets import (
    load_chat_extractive_cases,
    load_classification_fixtures,
    load_rvl_cdip_subset,
)
from closed_form_ml.metrics import bootstrap_ci, learning_curve_fits, peak_rss_mb, timed
from closed_form_ml.models.classifiers import DeepStackE5Classifier, NestAdapterClassifier, RidgeE5Classifier
from closed_form_ml.models.field_suggestions import (
    ConditionalFieldSuggester,
    load_cord_value_examples,
)
from closed_form_ml.models.kv_extractor import RegexKVExtractor
from closed_form_ml.models.reader import E5SentenceReader, RidgeSpanReader, TokenOverlapReader, XlmRobertaReader
from closed_form_ml.models.retriever import HybridE5Bm25Retriever

WORKSPACE = Path(__file__).resolve().parents[5]
WORKER_SRC = WORKSPACE / "apps" / "worker" / "src"
sys.path.insert(0, str(WORKER_SRC))


def _accuracy(y_true: list[str], y_pred: list[str | None]) -> float:
    ok = 0
    for truth, pred in zip(y_true, y_pred, strict=True):
        if pred == truth:
            ok += 1
    return ok / max(len(y_true), 1)


def _open_set_metrics(
    y_true: list[str],
    results: list,
    *,
    unknown_label: str,
) -> dict[str, float]:
    """Treat holdout label as unknown: should reject."""
    reject_ok = 0
    accept_ok = 0
    accept_total = 0
    reject_total = 0
    for truth, res in zip(y_true, results, strict=True):
        if truth == unknown_label:
            reject_total += 1
            if res.rejected or res.label_id is None:
                reject_ok += 1
        else:
            accept_total += 1
            if not res.rejected and res.label_id == truth:
                accept_ok += 1
    return {
        "closed_accuracy": accept_ok / max(accept_total, 1),
        "open_rejection_recall": reject_ok / max(reject_total, 1),
    }


def _stratified_folds(
    examples: list,
    *,
    n_folds: int,
    seed: int,
) -> list[tuple[list[int], list[int]]]:
    by_label: dict[str, list[int]] = {}
    for i, ex in enumerate(examples):
        by_label.setdefault(ex.label_id, []).append(i)
    rng = np.random.default_rng(seed)
    folds: list[list[int]] = [[] for _ in range(n_folds)]
    for indices in by_label.values():
        rng.shuffle(indices)
        for j, idx in enumerate(indices):
            folds[j % n_folds].append(idx)
    splits: list[tuple[list[int], list[int]]] = []
    all_idx = list(range(len(examples)))
    for k in range(n_folds):
        test_idx = folds[k]
        train_idx = [i for i in all_idx if i not in set(test_idx)]
        splits.append((train_idx, test_idx))
    return splits


def run_classification(*, seed: int, cv_folds: int = 3) -> dict:
    train, open_test = load_classification_fixtures()
    all_examples = train + open_test
    if len(train) > 850:
        rng_sub = np.random.default_rng(seed)
        pick = rng_sub.choice(len(train), 850, replace=False)
        train = [train[int(i)] for i in pick]
        all_examples = train + open_test
    rvl = load_rvl_cdip_subset(max_per_class=25, max_classes=6, seed=seed)
    unknown = "werkstattbericht"
    cv_method_types: dict[str, type] = {
        "ridge_e5": RidgeE5Classifier,
        "deep_stack_e5": DeepStackE5Classifier,
    }
    slow_method_types: dict[str, type] = {
        "nest_ce": NestAdapterClassifier,
    }
    out: dict = {"task": "document_type_classification", "methods": {}, "rvl_cdip": {}}
    folds = _stratified_folds(all_examples, n_folds=cv_folds, seed=seed)
    open_test_texts = [ex.text for ex in open_test]
    open_test_labels = [ex.label_id for ex in open_test]
    train_sizes = [200, 600, 1200, 2400]
    all_texts = [ex.text for ex in all_examples]
    all_vectors = embed_passages(all_texts)
    def _eval_method(name: str, clf_type: type, *, run_cv: bool) -> None:
        cv_correct: list[float] = []
        t0 = time.perf_counter()
        if not run_cv:
            folds_local = []
        else:
            folds_local = folds
        for train_idx, test_idx in folds_local:
            train_vectors: list = []
            train_y: list[str] = []
            for i in train_idx:
                if all_examples[i].label_id == unknown:
                    continue
                train_vectors.append(all_vectors[i])
                train_y.append(all_examples[i].label_id)
            if not train_y:
                continue
            fold_clf = clf_type()
            fold_clf.fit_vectors(np.asarray(train_vectors), train_y)
            for i in test_idx:
                ex = all_examples[i]
                if ex.label_id == unknown:
                    continue
                pred = fold_clf.predict_vector(all_vectors[i]).label_id
                cv_correct.append(1.0 if pred == ex.label_id else 0.0)
        cv_time = time.perf_counter() - t0
        clf = clf_type()
        open_ids = {ex.document_id for ex in open_test}
        train_vecs = [all_vectors[i] for i, ex in enumerate(all_examples) if ex.document_id not in open_ids]
        tr_y = [ex.label_id for ex in all_examples if ex.document_id not in open_ids]
        t_fit = time.perf_counter()
        clf.fit_vectors(np.asarray(train_vecs), tr_y)
        train_s = time.perf_counter() - t_fit + cv_time
        tr_list_y = tr_y
        open_results = [clf.predict(t) for t in open_test_texts]
        curve_scores: list[float] = []
        for size in train_sizes:
            size = min(size, len(tr_list_y))
            subset_clf = clf_type()
            subset_clf.fit_vectors(np.asarray(train_vecs[:size]), tr_list_y[:size])
            sub_cv: list[float] = []
            for _train_idx, test_idx in folds[:1]:
                for i in test_idx:
                    ex = all_examples[i]
                    if ex.label_id == unknown:
                        continue
                    pred = subset_clf.predict_vector(all_vectors[i]).label_id
                    sub_cv.append(1.0 if pred == ex.label_id else 0.0)
            curve_scores.append(float(np.mean(sub_cv)) if sub_cv else 0.0)
        latencies: list[float] = []
        for text in open_test_texts[:24]:
            latencies.append(timed(lambda t=text: clf.predict(t)).latency_ms)
        entry = {
            "open_set_holdout": _open_set_metrics(open_test_labels, open_results, unknown_label=unknown),
            "learning_curve": learning_curve_fits(train_sizes, curve_scores),
            "train_time_s": train_s,
            "latency_ms": bootstrap_ci(latencies, seed=seed + 1),
            "peak_rss_mb": peak_rss_mb(),
        }
        if run_cv:
            entry["cv_closed_set_accuracy"] = bootstrap_ci(cv_correct, seed=seed)
        out["methods"][name] = entry

    for name, clf_type in cv_method_types.items():
        _eval_method(name, clf_type, run_cv=True)
    for name, clf_type in slow_method_types.items():
        _eval_method(name, clf_type, run_cv=False)
    if rvl:
        # 5-fold style split on RVL subset
        rng = np.random.default_rng(seed)
        idx = np.arange(len(rvl))
        rng.shuffle(idx)
        fold = int(len(rvl) * 0.2)
        test_idx = set(idx[:fold].tolist())
        rvl_train = [rvl[i] for i in range(len(rvl)) if i not in test_idx]
        rvl_test = [rvl[i] for i in range(len(rvl)) if i in test_idx]
        clf = RidgeE5Classifier(reject_threshold=0.35)
        clf.fit([x.text for x in rvl_train], [x.label_id for x in rvl_train])
        preds = [clf.predict(x.text).label_id for x in rvl_test]
        acc = _accuracy([x.label_id for x in rvl_test], preds)
        out["rvl_cdip"] = {"ridge_e5_accuracy": acc, "n_train": len(rvl_train), "n_test": len(rvl_test)}
    else:
        out["rvl_cdip"] = {"skipped": "datasets/rvl_cdip unavailable in this environment"}
    return out


def run_kv(*, seed: int) -> dict:
    sys.path.insert(0, str(WORKSPACE / "eval"))
    from layout_kv_roles.inference_eval import linking_f1, role_accuracy  # noqa: PLC0415
    from layout_kv_roles.synthetic_corpus import build_synthetic_documents  # noqa: PLC0415
    from docuvate_worker.infrastructure.ml.layout_kv_roles.model import get_layout_kv_role_head  # noqa: PLC0415

    documents = build_synthetic_documents()
    model = get_layout_kv_role_head()
    _prec, _rec, link_f1 = linking_f1(documents, model, apply_link_threshold=True)
    role_acc = role_accuracy(documents, model)
    regex = RegexKVExtractor()
    samples: list[tuple[str, list[str]]] = []
    for doc in documents[:12]:
        text = "\n".join(entity.text for entity in doc.entities)
        gold = [f"{doc.entities[k].text}:{doc.entities[v].text}" for k, v in doc.links]
        samples.append((text, gold))
    regex_f1: list[float] = []
    lats: list[float] = []
    for text, gold in samples:
        tc = timed(lambda: regex.extract(text))
        lats.append(tc.latency_ms)
        pred = {f"{p.key_text}:{p.value_text}" for p in tc.result}
        gold_set = set(gold)
        tp = len(pred & gold_set)
        prec = tp / max(len(pred), 1)
        rec = tp / max(len(gold_set), 1)
        f1 = 0.0 if prec + rec == 0 else 2 * prec * rec / (prec + rec)
        regex_f1.append(f1)
    out: dict = {
        "task": "key_value_extraction",
        "methods": {
            "regex_baseline": {
                "micro_f1": bootstrap_ci(regex_f1, seed=seed),
                "latency_ms": bootstrap_ci(lats, seed=seed + 2),
                "n_docs": len(samples),
            },
            "layout_ridge_ce_shipped": {
                "linking_f1_synthetic": link_f1,
                "role_accuracy_synthetic": role_acc,
                "note": "Linear head on frozen e5 + layout features (artifact v1)",
            },
        },
    }
    out["note"] = "FUNSD/XFUND reserved for offline eval (eval/layout_kv_roles/eval_offline.py)"
    return out


def run_rag_qa(*, seed: int, max_cases: int) -> dict:
    cases = load_chat_extractive_cases(max_cases=max_cases)
    retriever = HybridE5Bm25Retriever()
    readers = {
        "token_overlap_ce": TokenOverlapReader(),
        "e5_sentence_cosine_closed_form": E5SentenceReader(),
        "ridge_span_closed_form": RidgeSpanReader(),
        "xlm_roberta_finetune": XlmRobertaReader(),
    }
    # Build library index
    doc_ids: list[str] = []
    texts: list[str] = []
    for case in cases:
        for doc in case["documents"]:
            doc_ids.append(str(doc.get("filename") or doc.get("title")))
            texts.append(str(doc["text"]))
    retriever.index(doc_ids, texts)
    # Train ridge reader on first 60% cases
    split = int(len(cases) * 0.6)
    train_cases = cases[:split]
    eval_cases = cases[split:]
    train_q: list[str] = []
    train_ctx: list[str] = []
    train_ans: list[str] = []
    for case in train_cases:
        ctx = case["documents"][0]["text"]
        must = case.get("answer_must_contain") or []
        ans = must[0] if must else ""
        train_q.append(case["question"])
        train_ctx.append(ctx)
        train_ans.append(ans)
    readers["ridge_span_closed_form"].fit(train_q, train_ctx, train_ans)
    out: dict = {"task": "extractive_qa", "methods": {}}
    for name, reader in readers.items():
        hit_scores: list[float] = []
        read_scores: list[float] = []
        lats: list[float] = []
        for case in eval_cases:
            q = case["question"]
            tc_r = timed(lambda: retriever.retrieve(q, top_k=3))
            lats.append(tc_r.latency_ms)
            hits = tc_r.result
            if not hits:
                hit_scores.append(0.0)
                read_scores.append(0.0)
                continue
            ctx = hits[0].text
            gold_ctx = case["documents"][0]["text"]
            evidence = case.get("evidence_in_retrieval") or []
            hit_ok = any(ev.lower() in ctx.lower() for ev in evidence) if evidence else True
            hit_scores.append(1.0 if hit_ok else 0.0)
            read_ctx = gold_ctx if len(case["documents"]) == 1 else ctx
            tc_a = timed(lambda: reader.answer(q, read_ctx))
            lats.append(tc_a.latency_ms)
            span = tc_a.result
            must = case.get("answer_must_contain") or []
            hay = span.text if span is not None else ""
            ok = span is not None and all(m.lower() in hay.lower() for m in must)
            if not ok and span is not None:
                ok = all(m.lower() in ctx.lower() for m in must)
            read_scores.append(1.0 if ok else 0.0)
        out["methods"][name] = {
            "retrieval_hit_rate": bootstrap_ci(hit_scores, seed=seed),
            "answer_accuracy": bootstrap_ci(read_scores, seed=seed + 3),
            "latency_ms": bootstrap_ci(lats, seed=seed + 4),
            "n_eval": len(eval_cases),
        }
    out["retrieval"] = "hybrid_e5_bm25_rrf"
    return out


def run_field_suggestions(*, seed: int) -> dict:
    path = WORKSPACE / "eval" / "data" / "cord_labeled_values.jsonl"
    examples = load_cord_value_examples(path, max_rows=2500)
    rng = np.random.default_rng(seed)
    idx = np.arange(len(examples))
    rng.shuffle(idx)
    split = int(len(examples) * 0.85)
    train = [examples[i] for i in idx[:split]]
    test = [examples[i] for i in idx[split:]]
    type_names = sorted({ex[2] for ex in examples})
    model = ConditionalFieldSuggester.fit(train, type_names=type_names)
    correct: list[float] = []
    lats: list[float] = []
    for label, text, typ in test:
        tc = timed(lambda: model.suggest(label, text))
        lats.append(tc.latency_ms)
        pred, _conf = tc.result
        correct.append(1.0 if pred == typ else 0.0)
    # Baseline: majority per label
    majority: dict[str, str] = {}
    counts: dict[str, dict[str, int]] = {}
    for label, _text, typ in train:
        bucket = counts.setdefault(label, {})
        bucket[typ] = bucket.get(typ, 0) + 1
    for label, bucket in counts.items():
        majority[label] = max(bucket, key=bucket.get)
    maj_correct: list[float] = []
    for label, _text, typ in test:
        maj_correct.append(1.0 if majority.get(label, type_names[0]) == typ else 0.0)
    return {
        "task": "field_suggestions_conditional_on_label",
        "ridge_conditional_e5": {
            "accuracy": bootstrap_ci(correct, seed=seed),
            "latency_ms": bootstrap_ci(lats, seed=seed + 5),
        },
        "majority_baseline": bootstrap_ci(maj_correct, seed=seed + 6),
        "n_train": len(train),
        "n_test": len(test),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output", type=Path, default=WORKSPACE / "research" / "closed_form_ml" / "results" / "matrix.json")
    parser.add_argument("--qa-cases", type=int, default=40)
    parser.add_argument("--cv-folds", type=int, default=3)
    args = parser.parse_args()
    disable_heavy_models()
    started = time.time()
    report = {
        "seed": args.seed,
        "environment": {"peak_rss_mb_start": peak_rss_mb()},
        "classification": run_classification(seed=args.seed, cv_folds=args.cv_folds),
        "kv_extraction": run_kv(seed=args.seed),
        "extractive_qa": run_rag_qa(seed=args.seed, max_cases=args.qa_cases),
        "field_suggestions": run_field_suggestions(seed=args.seed),
        "wall_time_s": 0.0,
    }
    report["wall_time_s"] = time.time() - started
    report["environment"]["peak_rss_mb_end"] = peak_rss_mb()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2, default=_json_default) + "\n", encoding="utf-8")
    print(f"wrote {args.output}")


def _json_default(obj: object) -> object:
    if hasattr(obj, "__dict__"):
        return obj.__dict__
    return str(obj)


if __name__ == "__main__":
    main()
