#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
API="$ROOT/apps/api"
DS="${TYPEORM_DATA_SOURCE:-$API/dist/shared/infrastructure/database/data-source.js}"

ensure_built() {
  if [[ ! -f "$DS" ]]; then
    pnpm --filter @docuvate/api build
  fi
}

guard_baseline_revert() {
  [[ "${1:-}" == "revert" ]] || return 0
  local force=""
  for arg in "$@"; do [[ "$arg" == "--force-baseline" ]] && force=1; done
  [[ -n "$force" ]] && return 0
  [[ -n "${DATABASE_URL:-}" ]] || { echo "DATABASE_URL required" >&2; exit 1; }
  local count
  count="$(psql "$DATABASE_URL" -tAc "SELECT count(*)::int FROM migrations" 2>/dev/null | tr -d '[:space:]' || echo 0)"
  if [[ "$count" -le 1 ]]; then
    cat >&2 <<EOF
ERROR: Refusing to revert the baseline migration (would drop all tables).
FEHLER: Baseline-Rücknahme blockiert — alle Tabellen würden gelöscht.

Use: pnpm db:revert -- --force-baseline
EOF
    exit 1
  fi
}

filter_force() {
  ARGS=()
  for arg in "$@"; do
    [[ "$arg" == "--force-baseline" ]] || ARGS+=("$arg")
  done
}

cmd="${1:-}"
shift || true
ORIG_ARGS=("$@")
filter_force "$@"
set -- "${ARGS[@]}"

ensure_built
guard_baseline_revert "$cmd" "${ORIG_ARGS[@]}"

CLI="$API/node_modules/typeorm/cli.js"

case "$cmd" in
  migrate|up)
    node "$API/dist/shared/infrastructure/database/run-migrate.js"
    ;;
  revert|rollback)
    node "$CLI" migration:revert -d "$DS" "$@"
    ;;
  status|show)
    node "$CLI" migration:show -d "$DS" "$@"
    ;;
  new|create)
    name="${1:?Migration name required}"
    node "$CLI" migration:create "$API/src/shared/infrastructure/database/migrations/${name}" "$@"
    ;;
  generate)
    name="${1:?Migration name required}"
    node "$CLI" migration:generate -d "$DS" "$API/src/shared/infrastructure/database/migrations/${name}" "${@:2}"
    ;;
  generate-check|check)
    bash "$ROOT/scripts/db/migration-generate-check.sh" "$@"
    ;;
  *)
    echo "Usage: typeorm-cli.sh {migrate|revert|status|new|generate|generate-check} ..." >&2
    exit 1
    ;;
esac
