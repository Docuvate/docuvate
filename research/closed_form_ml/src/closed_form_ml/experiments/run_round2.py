# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Round 2: real public OCR datasets, deep closed-form vs shallow, full baselines."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

import numpy as np

WORKSPACE = Path(__file__).resolve().parents[5]
WORKER_SRC = WORKSPACE / "apps" / "worker" / "src"
EVAL_DIR = WORKSPACE / "eval"
sys.path.insert(0, str(WORKER_SRC))
sys.path.insert(0, str(EVAL_DIR))

from closed_form_ml.baselines.ollama_reader import OllamaExtractiveReader, ensure_ollama_models
from closed_form_ml.deep_closed_form import (
    ShallowRidgeHead,
    SpectralDeepClassifier,
    TargetPropagationDeepClassifier,
)
from closed_form_ml.embeddings import embed_passages, embed_queries, l2_normalize
from closed_form_ml.experiments.kv_link_closed_form import BinaryLinkDeepTP, BinaryLinkRidge
from closed_form_ml.experiments.real_data import (
    DocVqaExample,
    RvlDocument,
    load_docvqa_eval_subset,
    load_rvl_cdip_ocr_subset,
    load_sroie_train_documents,
)
from closed_form_ml.metrics import bootstrap_ci, peak_rss_mb, timed
from closed_form_ml.models.reader import E5SentenceReader, RidgeSpanReader, TokenOverlapReader, XlmRobertaReader

from docuvate_worker.infrastructure.fastembed_model import embed_passages as worker_embed
from docuvate_worker.infrastructure.ml.layout_kv_roles.features import (
    LayoutEntity,
    entity_feature_vector,
    link_feature_vector,
)
from layout_kv_roles.corpus import load_cord_train_documents, load_funsd_documents
from layout_kv_roles.inference_eval import _layout_entities, linking_f1
from layout_kv_roles.synthetic_corpus import SyntheticDocument

OUTPUT_DEFAULT = WORKSPACE / "research" / "closed_form_ml" / "results" / "round2.json"
TRAIN_SIZES = [50, 100, 200, 500, 1000, 2000]


def _normalize_answer(text: str) -> str:
    return "".join(ch.lower() for ch in text.strip() if ch.isalnum())


def _answer_hit(pred: str, golds: tuple[str, ...]) -> bool:
    pred_n = _normalize_answer(pred)
    if not pred_n:
        return False
    for gold in golds:
        g = _normalize_answer(gold)
        if not g:
            continue
        if g in pred_n or pred_n in g:
            return True
    return False


def _learning_curve(
    sizes: list[int],
    train_fn,
    eval_fn,
) -> list[dict[str, float]]:
    points: list[dict[str, float]] = []
    for size in sizes:
        score = float(eval_fn(size))
        points.append({"train_size": float(size), "score": score})
    return points


def _stratified_split(docs: list[RvlDocument], *, test_frac: float, seed: int) -> tuple[list[int], list[int]]:
    by_label: dict[str, list[int]] = {}
    for i, doc in enumerate(docs):
        by_label.setdefault(doc.label_id, []).append(i)
    rng = np.random.default_rng(seed)
    train_idx: list[int] = []
    test_idx: list[int] = []
    for indices in by_label.values():
        rng.shuffle(indices)
        cut = max(1, int(len(indices) * test_frac))
        test_idx.extend(indices[:cut])
        train_idx.extend(indices[cut:])
    return train_idx, test_idx


def run_rvl_classification(*, seed: int) -> dict:
    docs = load_rvl_cdip_ocr_subset(max_total=2000, per_class=125, seed=seed)
    train_idx, test_idx = _stratified_split(docs, test_frac=0.2, seed=seed)
    texts = [d.text for d in docs]
    t0 = time.perf_counter()
    vectors = l2_normalize(embed_passages(texts))
    embed_s = time.perf_counter() - t0
    y_train_full = [docs[i].label_id for i in train_idx]
    x_train_full = vectors[train_idx]
    x_test = vectors[test_idx]
    y_test = [docs[i].label_id for i in test_idx]

    methods = {
        "shallow_ridge_e5": ShallowRidgeHead,
        "deep_target_propagation": TargetPropagationDeepClassifier,
        "deep_spectral_stack": SpectralDeepClassifier,
    }
    out: dict = {"n_docs": len(docs), "embed_time_s": embed_s, "methods": {}}
    sizes = [s for s in TRAIN_SIZES if s <= len(train_idx)]
    if len(train_idx) not in sizes:
        sizes.append(len(train_idx))

    for name, cls in methods.items():
        accs: list[float] = []
        curve: list[dict[str, float]] = []
        train_times: list[float] = []
        latencies: list[float] = []
        for size in sizes:
            rng = np.random.default_rng(seed + size)
            pick = train_idx if size >= len(train_idx) else list(rng.choice(train_idx, size=size, replace=False))
            x_tr = vectors[pick]
            y_tr = [docs[i].label_id for i in pick]
            t_fit = time.perf_counter()
            if cls is ShallowRidgeHead:
                model = ShallowRidgeHead.fit(x_tr, y_tr)
            else:
                model = cls.fit(x_tr, y_tr)
            train_times.append(time.perf_counter() - t_fit)
            probs = model.predict_proba(x_test)
            preds = [model.label_ids[int(np.argmax(row))] for row in probs]
            acc = sum(1 for p, t in zip(preds, y_test, strict=True) if p == t) / max(len(y_test), 1)
            curve.append({"train_size": float(size), "accuracy": acc})
            if size == sizes[-1]:
                accs = [1.0 if p == t else 0.0 for p, t in zip(preds, y_test, strict=True)]
        final_model = ShallowRidgeHead.fit(x_train_full, y_train_full) if cls is ShallowRidgeHead else cls.fit(
            x_train_full, y_train_full
        )
        for i in test_idx[:40]:
            latencies.append(
                timed(lambda idx=i: final_model.predict_proba(vectors[idx : idx + 1])).latency_ms
            )
        out["methods"][name] = {
            "test_accuracy": bootstrap_ci(accs, seed=seed),
            "learning_curve": curve,
            "train_time_s_last": train_times[-1] if train_times else 0.0,
            "latency_ms": bootstrap_ci(latencies, seed=seed + 1),
        }
    return out


def _embed_entities(doc: SyntheticDocument) -> list[LayoutEntity]:
    texts = [e.text for e in doc.entities]
    vecs = worker_embed(texts)
    entities: list[LayoutEntity] = []
    for idx, (spec, vector) in enumerate(zip(doc.entities, vecs, strict=True)):
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
    return entities


def _link_samples(
    docs: list[SyntheticDocument],
    *,
    max_neg_per_doc: int = 40,
    seed: int = 0,
) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(seed)
    xs: list[list[float]] = []
    ys: list[float] = []
    for doc in docs:
        entities = _embed_entities(doc)
        gold = {pair for pair in doc.links}
        positives: list[tuple[int, int]] = []
        negatives: list[tuple[int, int]] = []
        for key_idx in range(len(entities)):
            for value_idx in range(len(entities)):
                if key_idx == value_idx:
                    continue
                if (key_idx, value_idx) in gold:
                    positives.append((key_idx, value_idx))
                else:
                    negatives.append((key_idx, value_idx))
        if len(negatives) > max_neg_per_doc:
            pick = rng.choice(len(negatives), max_neg_per_doc, replace=False)
            negatives = [negatives[int(i)] for i in pick]
        for key_idx, value_idx in positives + negatives:
            feat = link_feature_vector(entities[key_idx], entities[value_idx])
            xs.append(feat)
            ys.append(1.0 if (key_idx, value_idx) in gold else 0.0)
    return np.asarray(xs, dtype=np.float64), np.asarray(ys, dtype=np.float64)


def _predict_links(doc: SyntheticDocument, scorer, *, threshold: float = 0.5) -> tuple[tuple[int, int], ...]:
    entities = _embed_entities(doc)
    keys = [i for i, e in enumerate(doc.entities) if e.role == "key"]
    values = [i for i, e in enumerate(doc.entities) if e.role == "value"]
    used: set[int] = set()
    links: list[tuple[int, int]] = []
    for key_idx in keys:
        best_v: int | None = None
        best_s = -1.0
        for value_idx in values:
            if value_idx in used:
                continue
            feat = np.asarray(
                link_feature_vector(entities[key_idx], entities[value_idx]),
                dtype=np.float64,
            ).reshape(1, -1)
            score = float(scorer.score(feat)[0])
            if score > best_s:
                best_s = score
                best_v = value_idx
        if best_v is not None and best_s >= threshold:
            used.add(best_v)
            links.append((key_idx, best_v))
    return tuple(links)


def run_kv_linking(*, seed: int) -> dict:
    cord = load_cord_train_documents(max_docs=250)
    sroie = load_sroie_train_documents(max_docs=200)
    train_docs = cord + sroie
    funsd = load_funsd_documents(split="test", max_docs=50)
    x_all, y_all = _link_samples(train_docs, max_neg_per_doc=30, seed=seed)
    rng = np.random.default_rng(seed)
    idx = np.arange(len(y_all))
    rng.shuffle(idx)
    split = int(len(idx) * 0.9)
    train_i, _val_i = idx[:split], idx[split:]
    x_train, y_train = x_all[train_i], y_all[train_i]

    shallow = BinaryLinkRidge.fit(x_train, y_train)
    deep = BinaryLinkDeepTP.fit(x_train, y_train, seed=seed)

    def _eval_f1(scorer) -> float:
        tp = fp = fn = 0
        for doc in funsd:
            gold = {pair for pair in doc.links}
            pred = set(_predict_links(doc, scorer))
            tp += len(gold & pred)
            fp += len(pred - gold)
            fn += len(gold - pred)
        prec = tp / (tp + fp) if (tp + fp) else 0.0
        rec = tp / (tp + fn) if (tp + fn) else 0.0
        return 2 * prec * rec / (prec + rec) if (prec + rec) else 0.0

    curve_shallow: list[dict] = []
    curve_deep: list[dict] = []
    pos_idx = np.where(y_train > 0.5)[0]
    neg_idx = np.where(y_train <= 0.5)[0]
    for size in [50, 100, 200, 500, min(800, len(train_i)), len(train_i)]:
        if size > len(train_i):
            continue
        n_pos = min(len(pos_idx), max(5, size // 5))
        n_neg = size - n_pos
        pick = np.concatenate([rng.choice(pos_idx, n_pos, replace=False), rng.choice(neg_idx, n_neg, replace=False)])
        xs = x_train[pick]
        ys = y_train[pick]
        curve_shallow.append(
            {"train_size": float(size), "funsd_link_f1": _eval_f1(BinaryLinkRidge.fit(xs, ys))}
        )
        curve_deep.append(
            {"train_size": float(size), "funsd_link_f1": _eval_f1(BinaryLinkDeepTP.fit(xs, ys, seed=seed))}
        )

    from docuvate_worker.infrastructure.ml.layout_kv_roles.model import get_layout_kv_role_head

    shipped_f1 = linking_f1(funsd, get_layout_kv_role_head(), apply_link_threshold=True)[2]

    return {
        "train_pairs": int(len(train_i)),
        "funsd_eval_docs": len(funsd),
        "shallow_ridge_link": {"funsd_f1": _eval_f1(shallow), "learning_curve": curve_shallow},
        "deep_target_prop_link": {"funsd_f1": _eval_f1(deep), "learning_curve": curve_deep},
        "ce_shipped_layout_head_f1": shipped_f1,
        "note": "FUNSD eval-only; CORD+SROIE train only",
    }


def run_docvqa(*, seed: int, max_eval: int, pull_ollama: bool) -> dict:
    train_pool, eval_set = load_docvqa_eval_subset(max_eval=max_eval, seed=seed)
    readers: dict[str, object] = {
        "token_overlap": TokenOverlapReader(),
        "e5_sentence_heuristic": E5SentenceReader(),
        "ridge_span_shallow": RidgeSpanReader(),
    }
    os.environ.pop("DOCUVATE_AI_PROFILE", None)
    readers["xlm_roberta_base"] = XlmRobertaReader()
    ollama_status = {}
    if pull_ollama:
        ollama_status = ensure_ollama_models(["qwen2.5:3b", "qwen3:4b"])
        if ollama_status.get("qwen2.5:3b"):
            readers["qwen2.5_3b_q4"] = OllamaExtractiveReader("qwen2.5:3b")
        if ollama_status.get("qwen3:4b"):
            readers["qwen3_4b_q4"] = OllamaExtractiveReader("qwen3:4b")

    # Train shallow ridge reader on increasing subsets
    sizes = [50, 100, 200, 500, min(800, len(train_pool))]
    ridge_curves: list[dict] = []
    deep_tp = TargetPropagationDeepClassifier
    deep_curves: list[dict] = []

    for size in sizes:
        subset = train_pool[:size]
        qs = [ex.question for ex in subset]
        ctxs = [ex.context_text for ex in subset]
        ans = [ex.answers[0] if ex.answers else "" for ex in subset]
        reader = RidgeSpanReader()
        reader.fit(qs, ctxs, ans)
        hits = []
        for ex in eval_set:
            span = reader.answer(ex.question, ex.context_text)
            pred = span.text if span else ""
            hits.append(1.0 if _answer_hit(pred, ex.answers) else 0.0)
        ridge_curves.append({"train_size": float(size), "accuracy": float(np.mean(hits)) if hits else 0.0})

    # Deep closed-form reader: sentence features + target-prop (custom fit)
    for size in sizes:
        feats: list[list[float]] = []
        labels: list[str] = []
        for ex in train_pool[:size]:
            q_vec = l2_normalize(embed_queries([ex.question]))[0]
            for sent in ex.context_text.split("."):
                sent = sent.strip()
                if len(sent) < 4:
                    continue
                p_vec = l2_normalize(embed_passages([sent]))[0]
                feat = np.concatenate([q_vec, p_vec, q_vec * p_vec])
                gold = ex.answers[0] if ex.answers else ""
                labels.append("pos" if gold and gold.lower() in sent.lower() else "neg")
                feats.append(feat.tolist())
        if not feats:
            continue
        model = deep_tp.fit(np.asarray(feats), labels, hidden_dims=(128, 64), reg=1e-2, seed=seed)
        hits = []
        for ex in eval_set:
            best_sent = ""
            best_p = -1.0
            q_vec = l2_normalize(embed_queries([ex.question]))[0]
            for sent in ex.context_text.split("."):
                sent = sent.strip()
                if len(sent) < 4:
                    continue
                p_vec = l2_normalize(embed_passages([sent]))[0]
                feat = np.concatenate([q_vec, p_vec, q_vec * p_vec]).reshape(1, -1)
                probs = model.predict_proba(feat)[0]
                pos_i = model.label_ids.index("pos") if "pos" in model.label_ids else 0
                if float(probs[pos_i]) > best_p:
                    best_p = float(probs[pos_i])
                    best_sent = sent
            hits.append(1.0 if _answer_hit(best_sent, ex.answers) else 0.0)
        deep_curves.append({"train_size": float(size), "accuracy": float(np.mean(hits)) if hits else 0.0})

    eval_results: dict = {}
    latencies: dict[str, list[float]] = {k: [] for k in readers}
    for name, reader in readers.items():
        hits = []
        for ex in eval_set:
            tc = timed(lambda r=reader, e=ex: r.answer(e.question, e.context_text))
            latencies[name].append(tc.latency_ms)
            span = tc.result
            pred = span.text if span else ""
            hits.append(1.0 if _answer_hit(pred, ex.answers) else 0.0)
        eval_results[name] = {
            "accuracy": bootstrap_ci(hits, seed=seed + 17),
            "latency_ms": bootstrap_ci(latencies[name][: min(80, len(eval_set))], seed=seed + 18),
            "n_eval": len(eval_set),
        }

    return {
        "n_train_pool": len(train_pool),
        "n_eval": len(eval_set),
        "eval_only": True,
        "ollama": ollama_status,
        "readers": eval_results,
        "ridge_span_learning_curve": ridge_curves,
        "deep_tp_sentence_learning_curve": deep_curves,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output", type=Path, default=OUTPUT_DEFAULT)
    parser.add_argument("--docvqa-eval", type=int, default=500)
    parser.add_argument("--pull-ollama", action="store_true")
    parser.add_argument("--skip-rvl", action="store_true")
    parser.add_argument("--skip-kv", action="store_true")
    parser.add_argument("--skip-docvqa", action="store_true")
    args = parser.parse_args()
    started = time.perf_counter()
    report = {
        "round": 2,
        "seed": args.seed,
        "environment": {"peak_rss_mb_start": peak_rss_mb()},
        "rvl_cdip_ocr": None if args.skip_rvl else run_rvl_classification(seed=args.seed),
        "kv_linking": None if args.skip_kv else run_kv_linking(seed=args.seed),
        "docvqa": None
        if args.skip_docvqa
        else run_docvqa(seed=args.seed, max_eval=args.docvqa_eval, pull_ollama=args.pull_ollama),
        "wall_time_s": 0.0,
        "peak_rss_mb_end": 0.0,
    }
    report["wall_time_s"] = time.perf_counter() - started
    report["peak_rss_mb_end"] = peak_rss_mb()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2, default=_json_default) + "\n", encoding="utf-8")
    print(f"wrote {args.output}")


def _json_default(obj: object) -> object:
    if hasattr(obj, "__dict__"):
        return obj.__dict__
    return str(obj)


if __name__ == "__main__":
    main()
