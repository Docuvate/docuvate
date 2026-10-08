#!/usr/bin/env bash
# Run Mermaid markdown check; retry once on Puppeteer WS endpoint launch timeout.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LOG="$(mktemp)"
trap 'rm -f "$LOG"' EXIT

run_check() {
  node "$ROOT/tools/docs/check-mermaid.mjs" 2>&1 | tee "$LOG"
  return "${PIPESTATUS[0]}"
}

if run_check; then
  exit 0
fi

if grep -qE 'Timed out after [0-9]+ ms while waiting for the WS endpoint|WS endpoint URL' "$LOG"; then
  echo "Mermaid check: browser launch timeout; retrying once..." >&2
  run_check
  exit $?
fi

exit 1
