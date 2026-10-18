# Model-gates baseline adjustments

## `chat_extractive.latency_p95_ms` ceiling (3500 ms)

GitHub-hosted CI runners show high variance for cold FastEmbed + RAG timing (often >1.2s p95
vs ~780ms on a warm dev machine). The gate still enforces accuracy/abstention/citation floors;
latency remains a coarse upper bound to catch catastrophic slowdowns, not micro-regressions.

The committed ratchet baseline for this metric was raised from **2500 ms** to **3000 ms**, then to
**3500 ms** so GitHub-hosted `ubuntu-latest` / `ubuntu-24.04-arm` model-gates jobs stay stable
(~3300 ms p95) while still catching
catastrophic slowdowns (warm dev machines remain ~780 ms p95).
