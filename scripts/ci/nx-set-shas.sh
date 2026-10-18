#!/usr/bin/env bash
# Set NX_BASE / NX_HEAD for nx affected (replaces nrwl/nx-set-shas; org action allowlist).
set -euo pipefail

nx_head="${NX_HEAD_INPUT:-${GITHUB_SHA:-}}"
if [[ -z "$nx_head" ]]; then
  nx_head="$(git rev-parse HEAD)"
fi

if [[ -n "${NX_BASE_INPUT:-}" ]]; then
  nx_base="$NX_BASE_INPUT"
elif [[ "${GITHUB_EVENT_NAME:-}" == "pull_request" ]]; then
  nx_base="${GITHUB_EVENT_PULL_REQUEST_BASE_SHA:-}"
  if [[ -z "$nx_base" && -n "${GITHUB_BASE_REF:-}" ]]; then
    git fetch --depth=1 origin "${GITHUB_BASE_REF}"
    nx_base="$(git merge-base "origin/${GITHUB_BASE_REF}" HEAD)"
  fi
elif [[ "${GITHUB_EVENT_NAME:-}" == "push" ]]; then
  nx_base="${GITHUB_EVENT_BEFORE:-}"
  if [[ -z "$nx_base" || "$nx_base" == "0000000000000000000000000000000000000000" ]]; then
    nx_base="$(git rev-parse "${nx_head}^" 2>/dev/null || git rev-parse HEAD~1)"
  fi
else
  nx_base="$(git rev-parse HEAD~1 2>/dev/null || git rev-parse HEAD)"
fi

if [[ -z "$nx_base" ]]; then
  git fetch --depth=1 origin main 2>/dev/null || git fetch --depth=1 origin master 2>/dev/null || true
  if git show-ref --verify --quiet refs/remotes/origin/main; then
    nx_base="$(git merge-base HEAD origin/main)"
  fi
fi

if [[ -z "$nx_base" || -z "$nx_head" ]]; then
  echo "Unable to resolve NX_BASE/NX_HEAD (base=${nx_base:-empty} head=${nx_head:-empty})" >&2
  exit 1
fi

git fetch --depth=1 origin "$nx_base" 2>/dev/null || true

echo "NX_BASE=$nx_base" >> "$GITHUB_ENV"
echo "NX_HEAD=$nx_head" >> "$GITHUB_ENV"
echo "NX_BASE=$nx_base NX_HEAD=$nx_head"
