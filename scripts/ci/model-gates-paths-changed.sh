#!/usr/bin/env bash
# Exit 0 when model-gates CI should run; exit 1 to skip.
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
set -euo pipefail

PATTERN='^(bench/|apps/worker/(src|tests)/|scripts/ci/(model-gates|install-typst|run-model-gates)\.|\.github/workflows/ci\.yml)'

if [[ "${GITHUB_EVENT_NAME:-}" == "pull_request" ]]; then
  base="${GITHUB_EVENT_PULL_REQUEST_BASE_SHA:-}"
  head="${GITHUB_SHA:-}"
  if [[ -z "$base" || -z "$head" ]]; then
    echo "Missing PR base/head SHA; running model-gates."
    exit 0
  fi
  if git diff --name-only "$base" "$head" | grep -qE "$PATTERN"; then
    echo "ML / bench paths changed."
    exit 0
  fi
  echo "No model-gates paths in PR diff; skip."
  exit 1
fi

if [[ "${GITHUB_EVENT_NAME:-}" == "push" && "${GITHUB_REF:-}" == "refs/heads/main" ]]; then
  exit 0
fi

exit 0
