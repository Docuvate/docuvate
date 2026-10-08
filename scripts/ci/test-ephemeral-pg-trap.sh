#!/usr/bin/env bash
# Verify ephemeral Postgres is stopped after a failing job subshell (RETURN trap + post-job cleanup).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export DOCUVATE_LOCAL_CI_RUN_ID="${DOCUVATE_LOCAL_CI_RUN_ID:-traptest$$}"
# shellcheck source=scripts/ci/lib-ephemeral-postgres.sh
source "$ROOT/scripts/ci/lib-ephemeral-postgres.sh"
# shellcheck source=scripts/ci/lib-port-hygiene.sh
source "$ROOT/scripts/ci/lib-port-hygiene.sh"

_fail_after_pg() {
  local cid=""
  docuvate_ci_start_postgres cid "trap-test"
  trap 'docuvate_ci_stop_postgres "$cid"' RETURN
  false
}

set +e
( set -euo pipefail; _fail_after_pg )
_sub_status=$?
set -e

docuvate_ci_stop_owned_containers

remaining="$(docker ps -q --filter "label=docuvate.local-ci.run-id=${DOCUVATE_LOCAL_CI_RUN_ID}" 2>/dev/null || true)"
if [[ -n "$remaining" ]]; then
  echo "ephemeral PG trap self-test: containers still running: ${remaining}" >&2
  docker ps --filter "label=docuvate.local-ci.run-id=${DOCUVATE_LOCAL_CI_RUN_ID}" >&2
  exit 1
fi

if [[ "$_sub_status" -ne 0 ]]; then
  echo "ephemeral PG trap self-test: OK (subshell failed as expected; no labeled containers left)"
else
  echo "ephemeral PG trap self-test: expected subshell failure" >&2
  exit 1
fi
