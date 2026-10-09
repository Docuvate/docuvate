#!/usr/bin/env python3
"""Cited-chat eval: end-to-end via API (compose) or worker microbench fallback.

Prints JSON with platform, thread env vars, medians (TTFT + total), and per-question runs.
Does not commit bench/cited-chat-eval-latest.json (gitignored).

When the API runs with DOCUVATE_CITED_CHAT_BENCH_STATS=1, rejected-claim counts are
returned on assistant messages as citedBenchStats (bench only).
"""

from __future__ import annotations

import argparse
import json
import os
import platform
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "worker" / "src"))
sys.path.insert(0, str(ROOT / "bench"))

from cited_stream_preview import extract_readable_cited_answer_preview, looks_like_cited_answer_json

ABSTENTION_SNIPPET = "nichts gefunden"

E2E_QUESTIONS: list[dict[str, str]] = [
    {"id": "q1", "question": "Welche Gesamtsumme steht auf der Rechnung Nordwind?", "expect": "answer"},
    {"id": "q2", "question": "Bis wann ist die Miete fällig?", "expect": "answer"},
    {"id": "q3", "question": "Welche Kündigungsfrist gilt im Vertrag?", "expect": "answer"},
    {"id": "q4", "question": "Was kostet die Hundesteuer?", "expect": "answer"},
    {"id": "q5", "question": "Welche IBAN hat der Absender?", "expect": "answer"},
    {
        "id": "q_multi",
        "question": "Nenne Gesamtsumme der Rechnung Nordwind und die Hundesteuer.",
        "expect": "multi_doc",
    },
    {"id": "q_off", "question": "Wie wird das Wetter morgen in Berlin?", "expect": "abstain"},
]


def thread_settings() -> dict[str, str | int | None]:
    keys = (
        "OMP_NUM_THREADS",
        "OPENBLAS_NUM_THREADS",
        "MKL_NUM_THREADS",
        "OLLAMA_NUM_THREADS",
        "DOCUVATE_AI_PROFILE",
        "RAG_RERANKER_GATE_MIN",
        "RAG_FUSION_GATE_MIN",
        "OLLAMA_NUM_CTX",
        "OLLAMA_NUM_PREDICT",
    )
    return {k: os.environ.get(k) for k in keys}


def meta_block(mode: str) -> dict[str, object]:
    return {
        "mode": mode,
        "platform": platform.platform(),
        "machine": platform.machine(),
        "processor": platform.processor(),
        "python": platform.python_version(),
        "thread_settings": thread_settings(),
        "api_url": os.environ.get("DOCUVATE_API_URL", "http://localhost:3001"),
    }


def median(values: list[float]) -> float | None:
    if not values:
        return None
    s = sorted(values)
    return round(s[len(s) // 2], 2)


class ApiClient:
    def __init__(self, base: str, email: str, password: str) -> None:
        self.base = base.rstrip("/")
        self.cookie = ""
        self._sign_in(email, password)

    def _sign_in(self, email: str, password: str) -> None:
        payload = json.dumps({"email": email, "password": password}).encode()
        req = urllib.request.Request(
            f"{self.base}/api/auth/sign-in/email",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            self.cookie = resp.headers.get("Set-Cookie", "")

    def _request(self, method: str, path: str, body: dict | None = None) -> dict:
        data = None if body is None else json.dumps(body).encode()
        headers = {"Content-Type": "application/json"}
        if self.cookie:
            headers["Cookie"] = self.cookie.split(";")[0]
        req = urllib.request.Request(
            f"{self.base}{path}",
            data=data,
            headers=headers,
            method=method,
        )
        with urllib.request.urlopen(req, timeout=300) as resp:
            return json.loads(resp.read().decode())

    def create_library_thread(self) -> str:
        out = self._request("POST", "/v1/chat/threads", {"title": "bench cited chat"})
        return str(out["thread"]["id"])

    def send_message(self, thread_id: str, message: str) -> str:
        out = self._request(
            "POST",
            f"/v1/chat/threads/{thread_id}/messages",
            {"message": message},
        )
        return str(out["assistantMessage"]["id"])

    def get_message(self, thread_id: str, message_id: str) -> dict:
        out = self._request("GET", f"/v1/chat/threads/{thread_id}/messages")
        for msg in out.get("messages", []):
            if str(msg.get("id")) == message_id:
                return msg
        return {}

    def stream_until_done(self, thread_id: str, message_id: str) -> dict[str, float | int | str]:
        url = f"{self.base}/v1/chat/threads/{thread_id}/messages/{message_id}/stream"
        headers = {}
        if self.cookie:
            headers["Cookie"] = self.cookie.split(";")[0]
        req = urllib.request.Request(url, headers=headers, method="GET")
        t0 = time.perf_counter()
        first_phase_ms: float | None = None
        first_content_ms: float | None = None
        last_phase = ""
        final_status = "unknown"
        citation_count = 0
        content = ""
        with urllib.request.urlopen(req, timeout=600) as resp:
            for raw in resp:
                line = raw.decode("utf-8", errors="replace").strip()
                if not line.startswith("data:"):
                    continue
                event = json.loads(line[5:].strip())
                now_ms = (time.perf_counter() - t0) * 1000
                msg = event.get("message") or {}
                phase = msg.get("generationPhase")
                if phase and phase != last_phase:
                    last_phase = str(phase)
                    if first_phase_ms is None:
                        first_phase_ms = now_ms
                content = str(msg.get("content") or "")
                preview = (
                    extract_readable_cited_answer_preview(content)
                    if looks_like_cited_answer_json(content)
                    else content.strip()
                )
                if preview and first_content_ms is None:
                    first_content_ms = now_ms
                if event.get("type") == "done":
                    final_status = str(msg.get("generationStatus", "done"))
                    content = str(msg.get("content", ""))
                    break
        rejected_claims = 0
        final_msg = self.get_message(thread_id, message_id)
        if final_msg:
            content = str(final_msg.get("content", content))
            citations = final_msg.get("citations") or []
            citation_count = len(citations)
            bench_stats = final_msg.get("citedBenchStats")
            timing_ms = None
            if isinstance(bench_stats, dict):
                rejected_claims = int(bench_stats.get("citedRejectedClaims", 0))
                timing_ms = bench_stats.get("timingMs")
            else:
                detail = final_msg.get("errorDetail")
                if isinstance(detail, str) and detail.strip().startswith("{"):
                    try:
                        rejected_claims = int(json.loads(detail).get("citedRejectedClaims", 0))
                    except json.JSONDecodeError:
                        rejected_claims = 0
        total_ms = (time.perf_counter() - t0) * 1000
        ttft_ms = first_content_ms or first_phase_ms or total_ms
        return {
            "ttft_ms": round(ttft_ms, 2),
            "first_phase_ms": round(first_phase_ms or ttft_ms, 2),
            "first_content_ms": round(first_content_ms or ttft_ms, 2),
            "total_ms": round(total_ms, 2),
            "final_status": final_status,
            "citation_count": citation_count,
            "rejected_claims": rejected_claims,
            "timing_ms": timing_ms,
            "content_preview": content[:120],
        }


def run_e2e() -> dict[str, object]:
    api = os.environ.get("DOCUVATE_API_URL", "http://localhost:3001")
    email = os.environ.get("E2E_SMOKE_EMAIL", "alex.upload@fixture.docuvate.test")
    password = os.environ.get("E2E_SMOKE_PASSWORD", "E2eSmokeFixture1!")
    client = ApiClient(api, email, password)
    thread_id = client.create_library_thread()
    runs: list[dict[str, object]] = []
    for item in E2E_QUESTIONS:
        t_send = time.perf_counter()
        message_id = client.send_message(thread_id, item["question"])
        send_ms = (time.perf_counter() - t_send) * 1000
        stream = client.stream_until_done(thread_id, message_id)
        run = {
            "id": item["id"],
            "question": item["question"],
            "expect": item["expect"],
            "send_ms": round(send_ms, 2),
            **stream,
        }
        if item["expect"] == "abstain":
            run["abstained"] = ABSTENTION_SNIPPET in str(stream.get("content_preview", "")).lower()
            run["pass"] = run["abstained"] and stream["citation_count"] == 0
        elif item["expect"] == "multi_doc":
            run["pass"] = stream["citation_count"] >= 2
        else:
            run["pass"] = stream["citation_count"] >= 1 and ABSTENTION_SNIPPET not in str(
                stream.get("content_preview", "")
            ).lower()
        runs.append(run)
    ttfts = [float(r["ttft_ms"]) for r in runs]
    totals = [float(r["total_ms"]) for r in runs]
    rejected_total = sum(int(r.get("rejected_claims", 0)) for r in runs)
    passed = sum(1 for r in runs if r.get("pass"))
    return {
        "meta": meta_block("e2e_api"),
        "medians": {
            "median_ttft_ms": median(ttfts),
            "median_total_ms": median(totals),
        },
        "summary": {
            "passed": passed,
            "total": len(runs),
            "rejected_claims_total": rejected_total,
        },
        "runs": runs,
    }


OLLAMA_COMPARE_MODELS = (
    "qwen2.5:1.5b",
)


def run_ollama_model_compare() -> dict[str, object]:
    """Calls local Ollama for German fixture prompts; reports accuracy proxy and latency."""
    ollama = os.environ.get("OLLAMA_URL", "http://localhost:11434").rstrip("/")
    models = os.environ.get("OLLAMA_COMPARE_MODELS", ",".join(OLLAMA_COMPARE_MODELS)).split(",")
    models = [m.strip() for m in models if m.strip()]
    passages = (
        "[S1]\nRechnung Nordwind GmbH\nGesamtsumme: 1.234,56 EUR\nIBAN DE89370400440532013000\n\n"
        "[S2]\nBescheid Hundesteuer Stadt Muster\nJahresgebühr: 120,00 EUR"
    )
    system = (
        "Antworte nur mit JSON. claims: text, source (S1/S2), quote wörtlich max 10 Wörter. "
        "Beispiel: "
        '{"claims":[{"text":"Die Gesamtsumme beträgt 1.234,56 EUR.","source":"S1","quote":"Gesamtsumme: 1.234,56 EUR"}]}'
        f"\nQuellen:\n{passages}"
    )
    questions = E2E_QUESTIONS[:5]
    rows: list[dict[str, object]] = []
    for model in models:
        model_pass = 0
        totals: list[float] = []
        for item in questions:
            body = json.dumps(
                {
                    "model": model,
                    "stream": False,
                    "think": False,
                    "format": "json",
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": item["question"]},
                    ],
                    "options": {"temperature": 0, "num_predict": 256},
                }
            ).encode()
            t0 = time.perf_counter()
            try:
                req = urllib.request.Request(
                    f"{ollama}/api/chat",
                    data=body,
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=180) as resp:
                    payload = json.loads(resp.read().decode())
            except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
                rows.append(
                    {
                        "model": model,
                        "question_id": item["id"],
                        "error": str(exc),
                        "pass": False,
                    }
                )
                continue
            total_ms = (time.perf_counter() - t0) * 1000
            totals.append(total_ms)
            raw = str((payload.get("message") or {}).get("content") or "")
            ok = '"claims"' in raw and "quote" in raw and ABSTENTION_SNIPPET not in raw.lower()
            if ok:
                model_pass += 1
            rows.append(
                {
                    "model": model,
                    "question_id": item["id"],
                    "total_ms": round(total_ms, 2),
                    "pass": ok,
                }
            )
        rows.append(
            {
                "model": model,
                "summary": True,
                "accuracy": round(model_pass / max(len(questions), 1), 3),
                "median_total_ms": median(totals),
                "under_10s": all(t <= 10_000 for t in totals) if totals else None,
            }
        )
    return {
        "meta": meta_block("ollama_model_compare"),
        "default_recommendation": "qwen2.5:1.5b default; qwen2.5:3b needs ~6GB+ Ollama RAM on Apple Silicon (often OOM in Docker)",
        "runs": rows,
    }


def run_micro() -> dict[str, object]:
    from docuvate_worker.infrastructure.chat.rag_rerank import RagPassage, rerank_passages
    from docuvate_worker.infrastructure.fastembed_model import embed_passages, embed_query

    passages = [
        RagPassage(id="c1", text="Rechnung Nordwind: Gesamtsumme 1.234,56 EUR, fällig 15.03."),
        RagPassage(id="c2", text="Mietvertrag: Miete bis zum 3. Werktag fällig."),
        RagPassage(id="c3", text="Vertrag: Kündigungsfrist drei Monate zum Quartalsende."),
    ]
    runs: list[dict[str, object]] = []
    for item in E2E_QUESTIONS[:5]:
        question = item["question"]
        t0 = time.perf_counter()
        _ = embed_query(question)
        embed_ms = (time.perf_counter() - t0) * 1000
        t1 = time.perf_counter()
        ranked, reranker_used = rerank_passages(question, passages, top_k=4)
        rerank_ms = (time.perf_counter() - t1) * 1000
        runs.append(
            {
                "id": item["id"],
                "question": question,
                "embed_query_ms": round(embed_ms, 2),
                "rerank_ms": round(rerank_ms, 2),
                "reranker_used": reranker_used,
                "top_rerank_score": ranked[0].score if ranked else None,
            }
        )
    totals = [
        float(r["embed_query_ms"]) + float(r["rerank_ms"])
        for r in runs
        if r.get("reranker_used")
    ]
    return {
        "meta": meta_block("micro_worker"),
        "medians": {
            "median_embed_plus_rerank_ms": median(totals),
            "median_rerank_ms": median([float(r["rerank_ms"]) for r in runs]),
        },
        "runs": runs,
        "note": "Set DOCUVATE_E2E=1 against a running compose stack for full API+Ollama timings.",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--e2e", action="store_true", help="Force API end-to-end eval")
    parser.add_argument("--micro", action="store_true", help="Worker embed+rerank only")
    parser.add_argument(
        "--compare-models",
        action="store_true",
        help="Ollama JSON generation compare on German fixture prompts",
    )
    args = parser.parse_args()
    use_e2e = args.e2e or os.environ.get("DOCUVATE_E2E", "").lower() in ("1", "true", "yes")
    if args.micro:
        use_e2e = False
    try:
        if args.compare_models:
            out = run_ollama_model_compare()
        elif use_e2e:
            out = run_e2e()
        else:
            out = run_micro()
    except urllib.error.URLError as exc:
        if use_e2e and not args.e2e:
            out = run_micro()
            out["meta"]["e2e_error"] = str(exc)
        else:
            raise
    print(json.dumps(out, indent=2, ensure_ascii=False))
    out_path = ROOT / "bench" / "cited-chat-eval-latest.json"
    out_path.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
