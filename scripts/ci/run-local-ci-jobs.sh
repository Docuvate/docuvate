#!/usr/bin/env bash
# Run all jobs from .github/workflows/ci.yml locally; print PASS/FAIL + duration per job.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
mkdir -p "$ROOT/tmp"
cd "$ROOT"

NODE_PIN="$(awk '/^nodejs /{print $2; exit}' "$ROOT/.tool-versions")"
NODE_MAJOR_PIN="${NODE_PIN%%.*}"
if [[ -s "${HOME}/.nvm/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  source "${HOME}/.nvm/nvm.sh"
  nvm install "$NODE_PIN" >/dev/null 2>&1 || true
  nvm use "$NODE_PIN" >/dev/null 2>&1 || true
  if [[ -d "${NVM_DIR}/versions/node/v${NODE_PIN}/bin" ]]; then
    export PATH="${NVM_DIR}/versions/node/v${NODE_PIN}/bin:${PATH}"
  fi
fi
node_major="$(node -p "Number(process.versions.node.split('.')[0])")"
if [[ "$node_major" -lt "$NODE_MAJOR_PIN" ]]; then
  echo "ERROR: Node.js ${NODE_PIN}+ required for local CI (found v$(node -p process.versions.node)). Install via asdf (see .tool-versions) or nvm." >&2
  exit 1
fi

PNPM_PIN="$(awk '/^pnpm /{print $2; exit}' "$ROOT/.tool-versions")"
UV_PIN="$(awk '/^uv /{print $2; exit}' "$ROOT/.tool-versions")"
if command -v node >/dev/null 2>&1; then
  export PATH="$(dirname "$(command -v node)"):${PATH}"
fi
if command -v corepack >/dev/null 2>&1; then
  corepack enable >/dev/null 2>&1 || true
  corepack prepare "pnpm@${PNPM_PIN}" --activate >/dev/null 2>&1 || true
fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERROR: pnpm ${PNPM_PIN} not on PATH (install via asdf or corepack prepare)." >&2
  exit 1
fi

RESULTS="$ROOT/tmp/local-ci-results.tsv"
: >"$RESULTS"
FAILED=0
RUN_UX=0
for arg in "$@"; do
  case "$arg" in
    --ux) RUN_UX=1 ;;
  esac
done

export DOCUVATE_LOCAL_CI_RUN_ID="${DOCUVATE_LOCAL_CI_RUN_ID:-localci$(date +%s)-$$}"
export DOCUVATE_LOCAL_CI_IMAGE_TAG="${DOCUVATE_LOCAL_CI_RUN_ID}"

# shellcheck source=scripts/ci/lib-run-job.sh
source "$ROOT/scripts/ci/lib-run-job.sh"
# shellcheck source=scripts/ci/lib-ephemeral-postgres.sh
source "$ROOT/scripts/ci/lib-ephemeral-postgres.sh"
# shellcheck source=scripts/ci/lib-port-hygiene.sh
source "$ROOT/scripts/ci/lib-port-hygiene.sh"

trap docuvate_ci_runner_cleanup EXIT

docuvate_ci_compose_files_array() {
  DOCUVATE_CI_COMPOSE_FILES=(-f "$ROOT/docker-compose.yml" -f "$ROOT/docker-compose.ci.yml" -f "$ROOT/scripts/ci/docker-compose.local-ci.yml")
}

run_local_ci_job() {
  local name="$1"
  local fn="$2"
  docuvate_ci_pre_job "$name"
  run_job "$name" "$fn"
  docuvate_ci_stop_owned_containers
}

job_lint_test() {
  cd "$ROOT"
  bash scripts/ci/test-run-job.sh
  bash scripts/ci/check-no-and-chains.sh
  bash scripts/ci/test-ephemeral-pg-trap.sh
  local lint_pg_cid=""
  docuvate_ci_start_postgres lint_pg_cid "lint-test"
  trap 'docuvate_ci_stop_postgres "$lint_pg_cid"' RETURN
  pnpm install
  bash scripts/ci/mermaid-chrome-setup.sh
  bash scripts/ci/check-mermaid-markdown.sh
  node scripts/testing/check-no-legacy.mjs
  bash scripts/ci/check-conflict-markers.sh
  node scripts/ci/check-tool-versions.mjs
  node --test scripts/ci/check-tool-versions.test.mjs
  if [[ ! -x /opt/flutter/bin/flutter ]]; then
    if [[ "${DV_AGENT_VM:-0}" != "1" ]]; then
      echo "flutter not found; install it or run with DV_AGENT_VM=1" >&2
      exit 1
    fi
    sudo apt-get update -qq
    sudo apt-get install -y -qq curl xz-utils
    curl -fsSL https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.24.5-stable.tar.xz | sudo tar xJ -C /opt
  fi
  export PATH="/opt/flutter/bin:$PATH"
  pnpm --filter @docuvate/tokens build
  pnpm --filter @docuvate/tokens test
  pnpm openapi:check
  pnpm sdk:check
  pnpm --filter @docuvate/contracts build
  pnpm --filter @docuvate/otel build
  pnpm --filter @docuvate/api typecheck
  pnpm --filter @docuvate/web typecheck
  pnpm --filter @docuvate/web lint
  pnpm --filter @docuvate/api test
  pnpm --filter @docuvate/web test
  pnpm --filter @docuvate/api test:coverage
  pnpm --filter @docuvate/web test:coverage
  node scripts/testing/coverage-ratchet.mjs
  export PATH="${HOME}/.local/bin:${PATH}"
  pip install -q "uv==${UV_PIN}"
  cd "$ROOT/apps/worker" && uv lock --check
  cd "$ROOT"
  node scripts/testing/doctor-ratchet.mjs
  pnpm --filter @docuvate/sdk build
  pnpm --filter @docuvate/sdk test
  cd "$ROOT/packages/sdk-flutter"
  flutter pub get
  dart analyze
  dart test
  TYPST_BIN_DIR="$(bash "$ROOT/scripts/ci/install-typst.sh" | awk -F= '/^typst_bin_dir=/{print $2}')"
  export PATH="${TYPST_BIN_DIR}:${PATH}"
  cd "$ROOT/apps/worker"
  PY_PIN="$(awk '/^python /{print $2; exit}' "$ROOT/.tool-versions")"
  UV_VENV_CLEAR=1 UV_PYTHON="$PY_PIN" uv venv .venv
  uv pip install -e ".[dev]"
  ./.venv/bin/ruff check src
  ./.venv/bin/pytest tests -q --ignore=tests/integration --maxfail=1
}

job_db_migrate_fresh() {
  cd "$ROOT"
  local migrate_pg_cid=""
  docuvate_ci_start_postgres migrate_pg_cid "db-migrate-fresh"
  trap 'docuvate_ci_stop_postgres "$migrate_pg_cid"' RETURN
  docuvate_ci_prepend_docker_psql "$migrate_pg_cid" "$ROOT/tmp/ci-bin-${DOCUVATE_LOCAL_CI_RUN_ID}-migrate"
  bash scripts/ci/test-docker-psql-shim.sh "$migrate_pg_cid"
  bash scripts/db/migration-roundtrip-check.sh
}

job_integration_test() {
  cd "$ROOT"
  cd apps/sftp-ingest
  go vet ./...
  go test ./...
  cd "$ROOT"
  docker info
  node scripts/testing/verify-container-images.mjs
  docker pull postgres:18.6-alpine@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873
  docker pull valkey/valkey:8-alpine@sha256:081c2f5cb575efc901aa80ff9cdbd1ec6a301682fd35e1ebb4b0990a4a4a8507
  docker pull cgr.dev/chainguard/minio@sha256:59667194421209c2c1eacbe761e24787e047985c5dfa96b15da9b59fe9b55cd0
  docker pull axllent/mailpit:v1.31.4@sha256:b68349e3a014b90c5610bfb26b2ae36f3892d7b8cf25ee140c6c71c98d2fcf48
  pnpm install
  pnpm --filter @docuvate/contracts build
  pnpm --filter @docuvate/otel build
  pnpm --filter @docuvate/api build
  pnpm --filter @docuvate/api test:integration
  export PATH="${HOME}/.local/bin:${PATH}"
  pip install "uv==${UV_PIN}"
  cd "$ROOT/apps/worker"
  PY_PIN="$(awk '/^python /{print $2; exit}' "$ROOT/.tool-versions")"
  UV_VENV_CLEAR=1 UV_PYTHON="$PY_PIN" uv venv .venv
  uv pip install -e ".[dev]"
  ./.venv/bin/pytest tests/integration -q --maxfail=1
  bash "$ROOT/scripts/testing/run-sftp-integration-e2e.sh"
}

job_docker_build() {
  cd "$ROOT"
  local project
  docuvate_ci_compose_files_array
  project="$(docuvate_ci_prepare_stack_compose)"
  docuvate_ci_compose_cmd "$project" "${DOCUVATE_CI_COMPOSE_FILES[@]}" build web api worker sftp-ingest
}

job_compose_smoke() {
  cd "$ROOT"
  local project smoke_down
  docuvate_ci_compose_files_array
  project="$(docuvate_ci_prepare_stack_compose)"
  docuvate_ci_assert_ports_free 3001 5173 5433 6379 8025 8000 9010 9011 11434
  smoke_down() {
    docuvate_ci_compose_cmd "$project" "${DOCUVATE_CI_COMPOSE_FILES[@]}" down --rmi local -v --remove-orphans 2>/dev/null || true
  }
  trap smoke_down RETURN
  smoke_down
  for attempt in 1 2 3 4; do
    if docuvate_ci_compose_cmd "$project" "${DOCUVATE_CI_COMPOSE_FILES[@]}" up -d --build \
      postgres migrate db-storage-guard minio minio-init valkey mailpit ollama-init api worker web; then
      break
    fi
    if [[ "$attempt" -eq 4 ]]; then exit 1; fi
    sleep $((attempt * 15))
  done
  code="$(docuvate_ci_compose_cmd "$project" "${DOCUVATE_CI_COMPOSE_FILES[@]}" ps -a migrate --format '{{.ExitCode}}')"
  test "$code" = "0"
  for i in $(seq 1 90); do
    if curl -sf http://localhost:3001/health/ready | jq -e '.status == "ready"' >/dev/null; then break; fi
    if [[ "$i" -eq 90 ]]; then
      docuvate_ci_compose_cmd "$project" "${DOCUVATE_CI_COMPOSE_FILES[@]}" logs api migrate worker valkey
      exit 1
    fi
    sleep 2
  done
  curl -sf http://localhost:3001/v1/openapi.json | jq -e '.info.title' >/dev/null
  curl -sf http://localhost:5173/ >/dev/null
  pnpm install --filter @docuvate/e2e... --ignore-scripts
  pnpm install --filter @docuvate/api... --ignore-scripts
  DATABASE_URL=postgresql://docuvate:docuvate@localhost:5433/docuvate \
    AUTH_BASE=http://localhost:3001 WEB_ORIGIN=http://localhost:5173 \
    node scripts/seed-labels-screenshots.mjs
  DATABASE_URL=postgresql://docuvate:docuvate@localhost:5433/docuvate \
    AUTH_BASE=http://localhost:3001 WEB_ORIGIN=http://localhost:5173 \
    node scripts/seed-e2e-smoke-user.mjs
  pnpm exec playwright install chromium --with-deps
  E2E_WEB_URL=http://localhost:5173 E2E_API_URL=http://localhost:3001 pnpm --filter @docuvate/e2e test
}

if [[ "${DV_AGENT_VM:-0}" == "1" ]]; then
  bash scripts/ci/agent-vm-docker-setup.sh
fi

run_local_ci_job lint-test job_lint_test
run_local_ci_job db-migrate-fresh job_db_migrate_fresh
run_local_ci_job integration-test job_integration_test
run_local_ci_job docker-build job_docker_build
run_local_ci_job compose-smoke job_compose_smoke

if [[ "$RUN_UX" -eq 1 ]]; then
  # compose-smoke tears its stack down, so the UX job brings up its own one.
  job_ux_metrics() {
    cd "$ROOT"
    local project ux_down
    docuvate_ci_compose_files_array
    project="$(docuvate_ci_prepare_stack_compose)"
    docuvate_ci_assert_ports_free 3001 5173 5433 6379 8025 8000 9010 9011 11434
    ux_down() {
      docuvate_ci_compose_cmd "$project" "${DOCUVATE_CI_COMPOSE_FILES[@]}" down --rmi local -v --remove-orphans 2>/dev/null || true
    }
    trap ux_down RETURN
    ux_down
    docuvate_ci_compose_cmd "$project" "${DOCUVATE_CI_COMPOSE_FILES[@]}" up -d --build \
      postgres migrate db-storage-guard minio minio-init valkey mailpit ollama-init api worker web
    for i in $(seq 1 90); do
      if curl -sf http://localhost:3001/health/ready | jq -e '.status == "ready"' >/dev/null; then break; fi
      if [[ "$i" -eq 90 ]]; then
        docuvate_ci_compose_cmd "$project" "${DOCUVATE_CI_COMPOSE_FILES[@]}" logs api migrate worker valkey
        exit 1
      fi
      sleep 2
    done
    pnpm exec playwright install chromium
    DATABASE_URL=postgresql://docuvate:docuvate@localhost:5433/docuvate \
      AUTH_BASE=http://localhost:3001 \
      WEB_ORIGIN=http://localhost:5173 \
      pnpm ux:metrics -- --check
  }
  run_local_ci_job ux-metrics job_ux_metrics
fi

echo "--- results ---"
column -t -s $'\t' "$RESULTS"
[[ "${FAILED:-0}" -eq 0 ]] || exit 1
exit 0
