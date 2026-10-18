#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export DOCUVATE_LOCAL_CI_RUN_ID="${DOCUVATE_LOCAL_CI_RUN_ID:-psqlshimtest$$}"
# shellcheck source=scripts/ci/lib-ephemeral-postgres.sh
source "$ROOT/scripts/ci/lib-ephemeral-postgres.sh"

own_pg=0
bin_dir=""
if [[ -n "${1:-}" ]]; then
  export DOCUVATE_PSQL_DOCKER_CID="$1"
else
  own_pg=1
  cid=""
  docuvate_ci_start_postgres cid "psql-shim-test"
  export DOCUVATE_PSQL_DOCKER_CID="$cid"
  bin_dir="$ROOT/tmp/ci-bin-psql-shim-test-$$"
  docuvate_ci_prepend_docker_psql "$cid" "$bin_dir"
  trap 'docuvate_ci_stop_postgres "$cid"; rm -rf "$bin_dir"' EXIT
fi

if printf 'SELECT 1;\n' | psql "${DATABASE_URL:-postgresql://docuvate:docuvate@127.0.0.1:5432/docuvate}" -tA | grep -q '^1$'; then
  echo "psql shim self-test: SELECT 1 OK"
else
  echo "psql shim self-test: SELECT 1 failed" >&2
  exit 1
fi

set +e
printf 'SELECT 1/0;\n' | psql "${DATABASE_URL}" -tA >/dev/null 2>&1
divide_status=$?
set -e
if [[ "$divide_status" -eq 0 ]]; then
  echo "psql shim self-test: SELECT 1/0 must fail but exited 0" >&2
  exit 1
fi
echo "psql shim self-test: SELECT 1/0 failed as expected (exit ${divide_status})"

if [[ "$own_pg" -eq 1 ]]; then
  docuvate_ci_stop_postgres "$cid"
  rm -rf "$bin_dir"
  trap - EXIT
fi
echo "psql shim self-test: OK"
