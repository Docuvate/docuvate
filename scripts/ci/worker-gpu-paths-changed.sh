#!/usr/bin/env bash
# Exit 0 when the GPU worker image should be built; exit 1 to skip.
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
set -euo pipefail

PATTERN='^(apps/worker/|scripts/ci/(worker-docker-install|assert-worker-cpu-pip-freeze|worker-gpu-paths-changed)\.|docker-compose(\.worker-gpu)?\.yml|deploy/|\.github/workflows/(ci|publish-images)\.yml)'

if [[ "${GITHUB_EVENT_NAME:-}" == "pull_request" ]]; then
  base="${GITHUB_EVENT_PULL_REQUEST_BASE_SHA:-}"
  head="${GITHUB_SHA:-}"
  if [[ -z "$base" || -z "$head" ]]; then
    echo "Missing PR base/head SHA; building GPU worker image."
    exit 0
  fi
  if git diff --name-only "$base" "$head" | grep -qE "$PATTERN"; then
    echo "worker GPU image paths changed."
    exit 0
  fi
  echo "No worker GPU image paths in PR diff; skip."
  exit 1
fi

exit 0
