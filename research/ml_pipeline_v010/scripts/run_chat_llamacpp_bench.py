#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""CPU llama.cpp chat bench: Qwen3-4B vs Qwen3.5-4B on identical evidence contexts."""

from __future__ import annotations

import json
import os
import re
import resource
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULTS = ROOT / "results"
FIXTURE = (
    Path(__file__).resolve().parents[3] / "bench" / "model_gates" / "fixtures" / "chat_extractive_cases.json"
)

MODELS: tuple[tuple[str, str, str], ...] = (
    (
        "qwen3-4b-instruct",
        "lmstudio-community/Qwen3-4B-Instruct-2507-GGUF",
        "Qwen3-4B-Instruct-2507-Q4_K_M.gguf",
    ),
    (
        "qwen3.5-4b-instruct",
        "Hob-forge/Qwen3.5-4B-Instruct-GGUF",
        "Qwen3.5-4B-Instruct-Q4_K_M.gguf",
    ),
)


def peak_rss_mb() -> float:
    return float(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss) / 1024.0


def build_prompt(question: str, evidence: str) -> str:
    return (
        "Du bist ein Dokumentenassistent. Antworte nur auf Basis des Kontexts. "
        "Wenn die Antwort nicht im Kontext steht, antworte exakt: UNBEKANNT.\n\n"
        f"Kontext:\n{evidence}\n\nFrage: {question}\nAntwort:"
    )


def faithfulness(answer: str, must_contain: list[str], must_not: list[str]) -> bool:
    low = answer.lower()
    if any(tok.lower() not in low for tok in must_contain if tok):
        return False
    return not any(tok.lower() in low for tok in must_not if tok)


def download_gguf(repo: str, filename: str) -> Path:
    from huggingface_hub import hf_hub_download

    cache = Path(__file__).resolve().parents[1] / ".cache" / "gguf"
    path = hf_hub_download(repo, filename=filename, cache_dir=str(cache))
    return Path(path)


def run_model(model_key: str, repo: str, filename: str, cases: list[dict]) -> dict[str, object]:
    from llama_cpp import Llama

    gguf = download_gguf(repo, filename)
    rss_before = peak_rss_mb()
    t_load = time.perf_counter()
    llm = Llama(
        model_path=str(gguf),
        n_ctx=4096,
        n_threads=int(os.environ.get("OMP_NUM_THREADS", "4")),
        verbose=False,
    )
    load_s = time.perf_counter() - t_load
    rss_loaded = peak_rss_mb()

    latencies: list[float] = []
    faithful = 0
    abstained = 0
    evaluated = 0
    for case in cases:
        docs = case.get("documents") or []
        if not docs:
            continue
        evidence = str(docs[0].get("text", ""))[:3500]
        question = str(case.get("question", ""))
        prompt = build_prompt(question, evidence)
        t0 = time.perf_counter()
        out = llm(prompt, max_tokens=120, temperature=0.0)
        latencies.append((time.perf_counter() - t0) * 1000.0)
        text = str(out["choices"][0]["text"]).strip()
        evaluated += 1
        if re.search(r"\bUNBEKANNT\b", text, re.I):
            abstained += 1
            if case.get("kind") == "unanswerable":
                faithful += 1
            continue
        if faithfulness(
            text,
            list(case.get("answer_must_contain") or []),
            list(case.get("answer_must_not_contain") or []),
        ):
            faithful += 1

    latencies.sort()
    del llm
    return {
        "model_key": model_key,
        "gguf_repo": repo,
        "gguf_file": filename,
        "license_note": "Qwen3/Qwen3.5 base Apache-2.0; GGUF repack per repo card",
        "cases_evaluated": evaluated,
        "faithfulness_rate": faithful / evaluated if evaluated else 0.0,
        "abstention_rate": abstained / evaluated if evaluated else 0.0,
        "latency_ms_median": latencies[len(latencies) // 2] if latencies else 0.0,
        "latency_ms_p95": latencies[int(round(0.95 * (len(latencies) - 1)))] if latencies else 0.0,
        "load_seconds": load_s,
        "peak_rss_mb_loaded": rss_loaded,
        "peak_rss_delta_mb": rss_loaded - rss_before,
    }


def main() -> int:
    payload = json.loads(FIXTURE.read_text(encoding="utf-8"))
    cases = payload.get("cases") or []
    answerable = [c for c in cases if c.get("kind") == "answerable"][:20]
    unanswerable = [c for c in cases if c.get("kind") == "unanswerable"][:10]
    multi = [c for c in cases if len(c.get("documents") or []) > 1][:5]
    selected = answerable + unanswerable + multi

    report: dict[str, object] = {
        "benchmark_kind": "synthetic_german_chat_extractive_fixtures",
        "fixture": str(FIXTURE),
        "provenance": payload.get("provenance"),
        "models": {},
    }
    for key, repo, fname in MODELS:
        try:
            report["models"][key] = run_model(key, repo, fname, selected)
        except Exception as exc:  # noqa: BLE001
            report["models"][key] = {"error": repr(exc)}

    RESULTS.mkdir(parents=True, exist_ok=True)
    out = RESULTS / "chat_llamacpp_qwen3_compare.json"
    out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
