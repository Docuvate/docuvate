#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKER_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
REPO_ROOT="$(cd "${WORKER_ROOT}/../.." && pwd)"
COMPOSE=(
  docker compose
  --profile smoke
  -f "${REPO_ROOT}/docker-compose.yml"
  -f "${REPO_ROOT}/docker-compose.ci.yml"
  -f "${REPO_ROOT}/docker-compose.smoke.yml"
)

WORKER_CID="$("${COMPOSE[@]}" ps -q worker)"
if [ -z "${WORKER_CID}" ]; then
  echo "worker container not running" >&2
  exit 1
fi

RESTARTS_BEFORE="$(docker inspect -f '{{.RestartCount}}' "${WORKER_CID}")"

echo "=== worker 2GiB compose soak (HTTP /v1/extract, default env) ==="
set +e
SOAK_JSON="$("${COMPOSE[@]}" exec -T worker \
  python tests/scripts/worker_compose_2g_soak.py \
  --base-url "http://127.0.0.1:8000" \
  --minutes "${WORKER_SOAK_MINUTES:-15}" \
  --min-successes "${WORKER_SOAK_MIN_DOCS:-50}")"
SOAK_RC=$?
set -e
echo "${SOAK_JSON}"

RESTARTS_AFTER="$(docker inspect -f '{{.RestartCount}}' "${WORKER_CID}")"
if [ "${RESTARTS_AFTER}" != "${RESTARTS_BEFORE}" ]; then
  echo "worker RestartCount changed ${RESTARTS_BEFORE} -> ${RESTARTS_AFTER}" >&2
  exit 5
fi

OOM_KILLED_LOG_LINES="$(docker logs "${WORKER_CID}" 2>&1 | rg -c 'likely_oom_kill=True' || true)"
echo "worker_soak_oom_killed_log_lines=${OOM_KILLED_LOG_LINES}"

if [ "${SOAK_RC}" -ne 0 ]; then
  exit "${SOAK_RC}"
fi

if [ "${OOM_KILLED_LOG_LINES}" != "0" ]; then
  echo "worker logged oom_killed child exits during soak" >&2
  exit 6
fi
