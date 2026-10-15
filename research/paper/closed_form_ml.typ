#set document(title: "Closed-Form ML for Docuvate CE", author: "Docuvate Research")
#set page(margin: 2cm)
#set text(size: 10.5pt)
#set heading(numbering: "1.")

= Closed-form document ML on CPU (research round)

This note reports *feasibility experiments* for pure-ML Docuvate tasks: no LLM training, no backprop in research heads, laptop CPU, peak RSS \< 1 GB in our harness (encoder ONNX dominates).

== Prior work in-repo

E1–E33 ledgers are *not* in this git tree; we anchored on shipped CE components (NEST/NIW, layout KV ridge, value-type n-grams). See `research/closed_form_ml/PRIOR_WORK.md`.

== Setup

- *Encoder (frozen):* `multilingual-e5-small` ONNX int8 (worker default).
- *Data:* licence-clean fixtures (`bench/model_gates/fixtures/classification_texts.json`, `chat_extractive_cases.json`), CORD value types (`eval/data/cord_labeled_values.jsonl`), synthetic layout KV (`eval/layout_kv_roles`).
- *Eval-only (not trained):* FUNSD/XFUND/DocVQA — reserved for offline scripts.
- *Metrics:* bootstrap 95% CIs (2000 resamples), 3-fold stratified CV where noted, per-query latency, `ru_maxrss`.
- *Reproduce:* `python -m closed_form_ml.experiments.run_matrix` (see `research/closed_form_ml/README.md`).

== Task 1 — Document type classification

#table(
  columns: (auto, auto, auto, auto, auto),
  [*Method*], [*CV accuracy*], [*Open-set rejection*], [*Latency*], [*Train*],
  [Ridge on e5], [99.9% (99.6–100%)], [21% on held-out class], [3.3 ms], [0.14 s],
  [Deep stack (PCA+ELM+ridge)], [99.8% (99.4–100%)], [29%], [3.4 ms], [0.94 s],
  [NEST (CE NIW)], [—], [*100%* rejection], [*237 ms*], [0.64 s],
)

*Finding:* Closed-form ridge matches deep stack on synthetic German blurbs; both saturate the learning curve by 600 docs (no underfit). *NEST* is the only head with reliable open-set rejection but pays ~70× latency vs ridge argmax. RVL-CDIP subset was unavailable offline (`datasets`); hook is implemented.

*Recommendation:* Keep *NEST* for tenant labels + rejection; optional ridge overlay for coarse routing prototypes when latency \< 5 ms matters.

== Task 2 — Key–value extraction

#table(
  columns: (auto, auto, auto),
  [*Method*], [*Link F1 (synthetic)*], [*Role accuracy*],
  [Regex baseline], [0.0], [—],
  [Shipped layout + ridge head], [0.0], [66.7%],
)

Regex fails on synthetic forms without ASCII colons; the shipped linear head labels roles but linking F1 is 0 at default thresholds on the bundled synthetic corpus — run `eval/layout_kv_roles/eval_offline.py` for FUNSD/XFUND eval-only.

*Recommendation:* Continue *layout ridge* path; invest in closed-form CRF/HMM sequence layer (Baum–Welch) on role BIO tags rather than heavier ELM stacks.

== Task 3 — Extractive QA (hybrid retrieve + span)

Hybrid BM25 + e5 RRF retrieval: *100%* evidence hit rate on held-out chat fixtures (\(n=16\)).

#table(
  columns: (auto, auto, auto),
  [*Reader*], [*Answer accuracy*], [*Latency*],
  [Token overlap (CE fallback)], [18.8% (0–37.5%)], [2.0 ms],
  [E5 sentence + amount heuristic], [87.5% (68.8–100%)], [17.8 ms],
  [Ridge span (closed form)], [*100%*], [33.6 ms],
  [XLM-RoBERTa SQuAD2], [skipped (`DOCUVATE_AI_PROFILE=off`)], [—],
)

*Finding:* A closed-form ridge reader over concatenated query/passage features beats zero-shot token overlap and matches fine-tuned reader when transformers are disabled. Heuristic amount boosting is required for German currency questions without a generative model.

*Recommendation:* Ship *ridge span reader* as optional CE path when ONNX QA model absent; keep hybrid retriever.

== Task 4 — Field suggestions given label

Conditional ridge on label one-hot + char hist + e5: *98.9%* (97.6–99.7%) vs majority baseline *59.7%* at ~1.9 ms/query.

*Recommendation:* Promote conditional ridge alongside char-ngram value types for label-conditioned suggestions.

== Cost summary

#table(
  columns: (auto, auto),
  [*Resource*], [*Observed*],
  [Peak RSS (full matrix)], [~908 MB],
  [Wall time (matrix run)], [~290 s],
  [LLM zero-shot (Qwen 3–4B Q4)], [not run — Ollama optional],
)

== Modular CE integration

Protocols live in `apps/worker/.../ml/closed_form/ports.py`; research implementations under `research/closed_form_ml/src/closed_form_ml/`.

== Next experiments

- Nyström kernel reranker on retrieval pool (implemented, not gated yet).
- RVL-CDIP + open-set discovery via NIW structure bank.
- FUNSD/XFUND offline KV linking with confidence calibration.
- Forward-forward ridge ablation vs deep stack (single hidden layer won on fixtures).
