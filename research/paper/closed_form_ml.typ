#set document(title: "Closed-Form ML for Docuvate CE — Round 2", author: "Docuvate Research")
#set page(margin: 2cm)
#set text(size: 10.5pt)
#set heading(numbering: "1.")

= Closed-form document ML on CPU (Round 2 — public OCR data)

Round 1 used licence-clean synthetic fixtures; metrics such as \(n=16\) QA at 100% are not evidence of production readiness. Round 2 pulls *real* public OCR-ground-truth data via Hugging Face, reports bootstrap 95% CIs, learning curves (train size 50→full), latency, and peak RSS, and tests whether *multi-layer closed-form* stacks beat a single ridge layer on hard tasks.

== Data sources (Round 2)

#table(
  columns: (auto, auto, auto),
  [*Corpus*], [*Use*], [*Split*],
  [HAMMALE/rvl\_cdip\_OCR], [Doc-type classification], [2000 docs / 16 classes, OCR paragraphs],
  [nielsr/docvqa\_1200\_examples], [Extractive QA], [500-question eval holdout; train for curves only],
  [CORD + darentang/sroie], [KV link training], [Train pairs; no FUNSD weights],
  [FUNSD (nielsr/funsd)], [KV linking eval], [Eval-only, 50 docs],
)

*Never* train shipped weights on FUNSD/XFUND/DocVQA. Reproduce: `research/closed_form_ml/scripts/run_round2.sh --seed 42 --docvqa-eval 500`.

== Environment

- Encoder: frozen `multilingual-e5-small` (ONNX int8, worker default).
- Round 2 wall time (RVL + DocVQA pass): ~831 s; peak RSS ~3.9 GB (DocVQA + XLM load).
- Ollama + `qwen2.5:3b` / `qwen3:4b` Q4: *not run* (Ollama install requires `zstd` / host packages unavailable in agent VM). Harness: `OllamaExtractiveReader` + `--pull-ollama`.
- XLM-RoBERTa: `deepset/xlm-roberta-base-squad2-distilled` with `transformers==4.46.3` (v5 removed QA pipeline).

== Task 1 — RVL-CDIP OCR (2000 docs, 16 classes)

20% stratified holdout (\(n=400\)). *Shallow ridge on e5* wins; deep closed-form stacks underfit noisy OCR text.

#table(
  columns: (auto, auto, auto, auto),
  [*Model*], [*Test accuracy (95% CI)*], [*Train 1600*], [*Latency/query*],
  [Shallow ridge (1 layer)], [*57.0%* (52.3–61.8%)], [57.0%], [~0.02 ms],
  [Deep spectral stack], [30.5% (26.0–35.3%)], [30.5%], [~0.09 ms],
  [Deep target propagation (3×ELM+ridge)], [25.8% (21.8–30.0%)], [25.8%], [~0.07 ms],
)

Learning curve (shallow): 50→26%, 100→37%, 500→39%, 1600→57% — clear *underfitting* at small \(n\), monotonic gain to full train (no collapse), consistent with generalization rather than synthetic saturation.

*Recommendation:* Use shallow ridge / NEST for routing; do not add depth on document-level e5 means for RVL-like OCR.

== Task 2 — KV linking (CORD+SROIE train → FUNSD eval)

Pairwise link features (frozen e5 + layout channels, same family as CE layout head). FUNSD linking F1 (50 docs):

#table(
  columns: (auto, auto),
  [*Method*], [*FUNSD link F1*],
  [Shallow ridge (closed form)], [0.120],
  [Deep target propagation (3 layers)], [0.121],
  [CE shipped layout-ridge artifact @ default thresholds], [0.0],
)

Depth gives *+0.001* F1 (within noise) at ~2× train cost on link pairs. Learning curves flat ~0.08–0.12 F1 — task is hard; domain shift CORD/SROIE→FUNSD dominates.

*Recommendation:* Depth is not a lever until features/alignment improve; prioritize layout-aware pairs + calibration (FUNSD offline gate).

== Task 3 — DocVQA (500-question eval, OCR words)

#table(
  columns: (auto, auto, auto),
  [*Reader*], [*Accuracy (95% CI)*], [*Latency*],
  [Token overlap (CE fallback)], [46.6% (42.4–50.8%)], [~0.07 ms],
  [E5 sentence + amount heuristic], [47.0% (42.8–51.4%)], [~78 ms],
  [Shallow ridge span], [47.2% (42.8–51.4%)], [~81 ms],
  [Deep TP sentence stack (3 layers)], [30.2% at full train pool], [—],
  [XLM-RoBERTa-base SQuAD2 (fine-tuned)], [*51.8%* (47.4–56.0%)], [~1–2 s/doc (CPU)],
)

Shallow ridge learning curve: 50→28.2%, 200→41.6%, 700→50.6% eval accuracy. Deep TP *underperforms* shallow at all train sizes (50→28.2% vs 28.2% tie, 700→30.2% vs 50.6%).

*Recommendation:* Closed-form span reader as CPU fallback below fine-tuned XLM; depth not justified on DocVQA with current sentence features. Re-run Qwen 3–4B Q4 when Ollama is available for small-LLM comparison.

== Core research question — does depth help?

On *real* hard tasks in this round:

1. *RVL classification:* **No** — shallow ridge +57% vs deep best +30%.
2. *DocVQA:* **No** — shallow ridge ~47% vs deep TP ~30%; XLM still +5 pts above closed-form.
3. *KV linking (FUNSD):* **Negligible** — shallow 0.120 vs deep 0.121 F1.

Multi-layer closed-form target propagation and spectral stacks are feasible on CPU but do not beat a single ridge layer on these tasks; extra layers add latency without accuracy gains.

== Modular CE ports

Unchanged: `Classifier`, `KVExtractor`, `Retriever`, `Reader` (`research/closed_form_ml`, `apps/worker/.../closed_form/ports.py`). Round 2 implementations: `deep_closed_form.py`, `run_round2.py`.

== Artifacts

- Round 1 matrix: `research/closed_form_ml/results/matrix.json`
- Round 2: `research/closed_form_ml/results/round2.json`
