#!/usr/bin/env bash
# Ephemeral postgres:18.6-alpine for local CI jobs (no host psql/postgres required).

DOCUVATE_PG_IMAGE="${DOCUVATE_PG_IMAGE:-postgres:18.6-alpine@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873}"

docuvate_ci_pick_host_port() {
  python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()'
}

docuvate_ci_start_postgres() {
  local cid_var="${1:-DOCUVATE_PG_DOCKER_CID}"
  local job_label="${2:-${DOCUVATE_CI_JOB_NAME:-local-ci}}"
  local host_port
  host_port="$(docuvate_ci_pick_host_port)"
  local pg_cid
  local label_run="${DOCUVATE_LOCAL_CI_RUN_ID:-unknown}"
  pg_cid="$(
    docker run -d --rm \
      --label "docuvate.local-ci.run-id=${label_run}" \
      --label "docuvate.local-ci.job=${job_label}" \
      -e POSTGRES_USER=docuvate \
      -e POSTGRES_PASSWORD=docuvate \
      -e POSTGRES_DB=docuvate \
      -p "127.0.0.1:${host_port}:5432" \
      "$DOCUVATE_PG_IMAGE"
  )"
  printf -v "$cid_var" '%s' "$pg_cid"
  export "$cid_var"
  export DATABASE_URL="postgresql://docuvate:docuvate@127.0.0.1:${host_port}/docuvate"
  if declare -F docuvate_ci_register_container >/dev/null 2>&1; then
    docuvate_ci_register_container "$pg_cid"
  fi
  local i
  for i in $(seq 1 30); do
    if docker exec "$pg_cid" pg_isready -U docuvate -d docuvate >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "postgres container ${pg_cid} did not become ready on port ${host_port}" >&2
  return 1
}

docuvate_ci_stop_postgres() {
  local cid="${1:-${DOCUVATE_PG_DOCKER_CID:-}}"
  if [[ -n "$cid" ]]; then
    docker stop "$cid" >/dev/null 2>&1 || true
  fi
}

docuvate_ci_prepend_docker_psql() {
  local cid="${1:?container id required}"
  local bin_dir="${2:?bin dir required}"
  local repo_root="${ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
  local shim="$repo_root/scripts/ci/docker-psql-shim.sh"
  mkdir -p "$bin_dir"
  cat >"$bin_dir/psql" <<EOF
#!/usr/bin/env bash
export DOCUVATE_PSQL_DOCKER_CID="$cid"
exec "$shim" "\$@"
EOF
  chmod +x "$bin_dir/psql"
  export PATH="$bin_dir:$PATH"
}
