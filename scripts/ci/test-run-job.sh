#!/usr/bin/env bash
# Self-test for run_job: subshell errexit must surface failures, not only the last command.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck source=scripts/ci/lib-run-job.sh
source "$ROOT/scripts/ci/lib-run-job.sh"

TMP_RESULTS="$(mktemp)"
trap 'rm -f "$TMP_RESULTS"' EXIT

_test_job_first_command_fails() {
  false
  echo unreachable
}

_test_job_and_chain_middle_fails() {
  true && false && true
}

_test_job_and_chain_then_more_succeeds() {
  true && false && true
  echo after
}

_test_job_all_pass() {
  true
  echo ok
}

run_self_test() {
  local label="$1"
  local fn="$2"
  local expect="$3"
  RESULTS="$TMP_RESULTS"
  : >"$TMP_RESULTS"
  FAILED=0
  run_job "$label" "$fn" 2>/dev/null
  local line outcome
  line="$(grep "^${label}" "$TMP_RESULTS" || true)"
  if [[ -z "$line" ]]; then
    echo "run_job self-test: missing result row for ${label}" >&2
    exit 1
  fi
  outcome="$(echo "$line" | cut -f2)"
  if [[ "$outcome" != "$expect" ]]; then
    echo "run_job self-test: ${label} expected ${expect}, got ${outcome}" >&2
    exit 1
  fi
}

run_self_test "self-first-fail" _test_job_first_command_fails FAIL
# Last command in the function is the && chain, so subshell exit status is non-zero.
run_self_test "self-and-middle-fail" _test_job_and_chain_middle_fails FAIL
# Known bash limitation: failed middle of && list does not trigger errexit; a later success masks it.
run_self_test "self-and-then-more-pass" _test_job_and_chain_then_more_succeeds PASS
run_self_test "self-all-pass" _test_job_all_pass PASS

echo "run_job self-test: OK (self-and-then-more-pass documents && + errexit limitation; use check-no-and-chains.sh)"
