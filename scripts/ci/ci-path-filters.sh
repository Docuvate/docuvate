#!/usr/bin/env bash
# Set path-filter outputs for CI jobs (replaces dorny/paths-filter; org action allowlist).
set -euo pipefail

diff_names() {
  if [[ "${GITHUB_EVENT_NAME:-}" == "pull_request" ]]; then
    base="${GITHUB_EVENT_PULL_REQUEST_BASE_SHA:-}"
    head="${GITHUB_SHA:-}"
    if [[ -z "$base" || -z "$head" ]]; then
      git diff --name-only HEAD~1 HEAD
      return
    fi
    git diff --name-only "$base" "$head"
    return
  fi
  if [[ "${GITHUB_EVENT_NAME:-}" == "push" ]]; then
    before="${GITHUB_EVENT_BEFORE:-}"
    after="${GITHUB_SHA:-}"
    if [[ -z "$before" || "$before" == "0000000000000000000000000000000000000000" ]]; then
      git diff --name-only HEAD~1 HEAD
      return
    fi
    git diff --name-only "$before" "$after"
    return
  fi
  git diff --name-only HEAD~1 HEAD
}

emit_if_match() {
  local name="$1"
  local pattern="$2"
  if diff_names | grep -qE "$pattern"; then
    echo "${name}=true" >> "$GITHUB_OUTPUT"
  else
    echo "${name}=false" >> "$GITHUB_OUTPUT"
  fi
}

emit_if_match docker '^(apps/[^/]+/Dockerfile|docker-compose[^/]*\.yml|pnpm-lock\.yaml|apps/worker/(pyproject\.toml|uv\.lock))'
emit_if_match k8s '^(deploy/|tools/k8s-|charts/)'
emit_if_match sftp '^apps/sftp-ingest/'
emit_if_match site '^(apps/site/|packages/tokens/)'
emit_if_match worker '^(apps/worker/|bench/)'
emit_if_match migrations '^apps/api/.*migrations/'
emit_if_match api '^(apps/api/|packages/contracts/|packages/otel/)'
