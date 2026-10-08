#!/usr/bin/env bash
# Install and warm chrome-headless-shell for @mermaid-js/mermaid-cli (pnpm dlx).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PUPPETEER_VERSION="${PUPPETEER_VERSION:-23.11.1}"
MERMAID_CLI_VERSION="${MERMAID_CLI_VERSION:-11.12.0}"
export PUPPETEER_CACHE_DIR="${PUPPETEER_CACHE_DIR:-${HOME}/.cache/puppeteer}"

npx "puppeteer@${PUPPETEER_VERSION}" browsers install chrome-headless-shell

warm_dir="$(mktemp -d)"
trap 'rm -rf "$warm_dir"' EXIT
printf '%s\n' 'flowchart LR; W[warm] --> D[done]' >"$warm_dir/warm.mmd"

pnpm dlx "@mermaid-js/mermaid-cli@${MERMAID_CLI_VERSION}" \
  -i "$warm_dir/warm.mmd" \
  -o "$warm_dir/warm.svg" \
  -b transparent \
  --puppeteerConfigFile "$ROOT/tools/docs/mermaid-puppeteer-config.json"
