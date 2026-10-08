#!/usr/bin/env bash
# Shared run_job helper (sourced by run-local-ci-jobs.sh and test-run-job.sh).
# Requires: ROOT, RESULTS, FAILED (integer, may be unset → treated as 0 by caller).

run_job_summarize_tests() {
  local log="$1"
  local snippets=()
  local line

  while IFS= read -r line; do
    snippets+=("$line")
  done < <(
    grep -E '(Tests[[:space:]]+[0-9]+ passed|Test Files[[:space:]]+[0-9]+ passed|[0-9]+ passed(\([0-9.]+\))?[[:space:]]*(,|$)|[0-9]+ passed in [0-9.]+s)' "$log" 2>/dev/null \
      | sed -E 's/^[[:space:]]+//;s/[[:space:]]+$//' \
      | awk '!seen[$0]++' \
      | tail -5
  )

  if ((${#snippets[@]} == 0)); then
    echo "-"
    return
  fi
  local joined=""
  local s
  for s in "${snippets[@]}"; do
    if [[ -n "$joined" ]]; then joined+="; "; fi
    joined+="$s"
  done
  echo "$joined"
}

run_job() {
  local name="$1"
  local fn="$2"
  local log="$ROOT/tmp/local-ci-${name}.log"
  local start end dur status tests outcome
  mkdir -p "$ROOT/tmp"
  start="$(date +%s)"
  set +e
  ( set -euo pipefail; "$fn" ) >"$log" 2>&1
  status=$?
  set -e
  end="$(date +%s)"
  dur=$((end - start))
  tests="$(run_job_summarize_tests "$log")"
  if [[ "$status" -eq 0 ]]; then
    outcome="PASS"
  else
    outcome="FAIL"
  fi
  echo -e "${name}\t${outcome}\t${dur}s\t${tests}" >>"$RESULTS"
  if [[ "$status" -ne 0 ]]; then
    echo "=== ${name} failed (see ${log}) ===" >&2
    tail -30 "$log" >&2
    FAILED=1
  fi
}
