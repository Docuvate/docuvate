#!/usr/bin/env bash
# Exit 0 if kind-smoke should run for this event; exit 1 to skip (job still succeeds).
set -euo pipefail

PATTERN='^(deploy/|tools/k8s-|scripts/ci/install-k8s-ci-tools\.sh|scripts/ci/kind-smoke-paths-changed\.sh|docker-compose(\.ci)?\.yml|apps/(api|web|worker)/Dockerfile|apps/web/nginx\.conf|\.github/workflows/ci\.yml)'

if [[ "${GITHUB_EVENT_NAME:-}" == "pull_request" ]]; then
  base="${GITHUB_EVENT_PULL_REQUEST_BASE_SHA:-}"
  head="${GITHUB_SHA:-}"
  if [[ -z "$base" || -z "$head" ]]; then
    echo "Missing PR base/head SHA; running kind-smoke."
    exit 0
  fi
  if git diff --name-only "$base" "$head" | grep -qE "$PATTERN"; then
    echo "kind-smoke paths changed."
    exit 0
  fi
  echo "No kind-smoke paths in PR diff; skip."
  exit 1
fi

if [[ "${GITHUB_EVENT_NAME:-}" == "push" ]]; then
  before="${GITHUB_EVENT_BEFORE:-}"
  after="${GITHUB_SHA:-}"
  if [[ -z "$before" || "$before" == "0000000000000000000000000000000000000000" ]]; then
    exit 0
  fi
  if git diff --name-only "$before" "$after" | grep -qE "$PATTERN"; then
    exit 0
  fi
  echo "No kind-smoke paths in push; skip."
  exit 1
fi

exit 0
