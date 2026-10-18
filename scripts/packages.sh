#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

case "${1:-}" in
  tokens)
    pnpm --filter @docuvate/tokens build
    ;;
  *)
    echo "Usage: $0 tokens" >&2
    exit 1
    ;;
esac
