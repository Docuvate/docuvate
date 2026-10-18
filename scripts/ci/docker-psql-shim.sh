#!/usr/bin/env bash
# psql wrapper: docker exec into DOCUVATE_LOCAL_CI ephemeral Postgres (stdin-safe).
set -euo pipefail

cid="${DOCUVATE_PSQL_DOCKER_CID:?DOCUVATE_PSQL_DOCKER_CID is required}"

args=()
argv=("$@")
has_on_error_stop=0
i=0
while ((i < ${#argv[@]})); do
  arg="${argv[i]}"
  if [[ "$arg" == postgres://* ]] || [[ "$arg" == postgresql://* ]]; then
    i=$((i + 1))
    continue
  fi
  case "$arg" in
    -h|-p|-H|-U|-d|-W|--host|--port|--username|--dbname|--password)
      echo "local-ci psql shim: flag ${arg} is not supported (use DATABASE_URL / fixed docuvate user+db)" >&2
      exit 2
      ;;
    -v)
      next="${argv[i + 1]:-}"
      if [[ "$next" == ON_ERROR_STOP* ]]; then
        has_on_error_stop=1
      fi
      ;;
  esac
  if [[ "$arg" == ON_ERROR_STOP* ]]; then
    has_on_error_stop=1
  fi
  args+=("$arg")
  i=$((i + 1))
done

if [[ "$has_on_error_stop" -eq 0 ]]; then
  args=(-v ON_ERROR_STOP=1 "${args[@]}")
fi

exec docker exec -i "$cid" psql -U docuvate -d docuvate "${args[@]}"
