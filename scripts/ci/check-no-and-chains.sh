#!/usr/bin/env bash
# Fail if job_* bodies in run-local-ci-jobs.sh use && / || (errexit blind spot), except allowed forms.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
target="$ROOT/scripts/ci/run-local-ci-jobs.sh"
in_job=0
job=""
line_no=0
violations=0

allowed_line() {
  local text="$1"
  if [[ "$text" =~ \|\|[[:space:]]*true ]]; then
    return 0
  fi
  if [[ "$text" =~ ^[[:space:]]*if[[:space:]] ]]; then
    return 0
  fi
  if [[ "$text" =~ ^[[:space:]]*for[[:space:]] ]]; then
    return 0
  fi
  if [[ "$text" =~ ^[[:space:]]*while[[:space:]] ]]; then
    return 0
  fi
  if [[ "$text" =~ ^[[:space:]]*elif[[:space:]] ]]; then
    return 0
  fi
  return 1
}

while IFS= read -r line || [[ -n "$line" ]]; do
  line_no=$((line_no + 1))
  if [[ "$line" =~ ^job_[a-z_0-9]+\(\)[[:space:]]*\{ ]]; then
    in_job=1
    job="${line%%(*}"
    continue
  fi
  if ((in_job == 1)) && [[ "$line" =~ ^\}[[:space:]]*$ ]]; then
    in_job=0
    job=""
    continue
  fi
  if ((in_job == 0)); then
    continue
  fi
  if [[ "$line" != *"&&"* ]] && [[ "$line" != *"||"* ]]; then
    continue
  fi
  if allowed_line "$line"; then
    continue
  fi
  echo "${target}:${line_no}: ${job}: disallowed && or || in job body: ${line}" >&2
  violations=$((violations + 1))
done <"$target"

if ((violations > 0)); then
  echo "check-no-and-chains: ${violations} violation(s). Split into separate commands." >&2
  exit 1
fi

echo "check-no-and-chains: OK"
