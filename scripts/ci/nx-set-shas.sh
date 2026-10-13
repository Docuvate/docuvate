#!/usr/bin/env bash
# Set NX_BASE / NX_HEAD for nx affected (replaces nrwl/nx-set-shas; org action allowlist).
set -euo pipefail

if [[ "${GITHUB_EVENT_NAME:-}" == "pull_request" ]]; then
  nx_base="${GITHUB_EVENT_PULL_REQUEST_BASE_SHA:-}"
  nx_head="${GITHUB_SHA:-}"
elif [[ "${GITHUB_EVENT_NAME:-}" == "push" ]]; then
  nx_base="${GITHUB_EVENT_BEFORE:-}"
  nx_head="${GITHUB_SHA:-}"
  if [[ -z "$nx_base" || "$nx_base" == "0000000000000000000000000000000000000000" ]]; then
    nx_base="$(git rev-parse "${nx_head:-HEAD}^" 2>/dev/null || git rev-parse HEAD)"
  fi
else
  nx_base="$(git rev-parse HEAD~1 2>/dev/null || git rev-parse HEAD)"
  nx_head="${GITHUB_SHA:-HEAD}"
fi

if [[ -z "$nx_base" || -z "$nx_head" ]]; then
  echo "Unable to resolve NX_BASE/NX_HEAD" >&2
  exit 1
fi

echo "NX_BASE=$nx_base" >> "$GITHUB_ENV"
echo "NX_HEAD=$nx_head" >> "$GITHUB_ENV"
echo "NX_BASE=$nx_base NX_HEAD=$nx_head"
