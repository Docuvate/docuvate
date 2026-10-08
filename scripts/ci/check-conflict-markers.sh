#!/usr/bin/env bash
# Fail if git-tracked files contain unresolved merge conflict markers.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if matches="$(git grep -nE '^(<<<<<<<|>>>>>>>) ' -- . 2>/dev/null || true)"; then
  :
fi

if [[ -n "${matches:-}" ]]; then
  echo "ERROR: Unresolved merge conflict markers in tracked files:" >&2
  echo "$matches" >&2
  echo "Remove <<<<<<< / ======= / >>>>>>> sections before merge." >&2
  exit 1
fi

echo "OK: no conflict markers in tracked files"
