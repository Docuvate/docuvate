# Model-gates baseline adjustments

## `chat_extractive.latency_p95_ms` ceiling (3000 ms)

GitHub-hosted CI runners show high variance for cold FastEmbed + RAG timing (often >1.2s p95
vs ~780ms on a warm dev machine). The gate still enforces accuracy/abstention/citation floors;
latency remains a coarse upper bound to catch catastrophic slowdowns, not micro-regressions.

The committed ratchet baseline for this metric was raised from **2500 ms** to **3000 ms** so it
matches the documented CI ceiling above (measured p95 on `ubuntu-latest` was ~2850 ms while the
old baseline still triggered false regressions).
