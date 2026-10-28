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

echo "=== worker 2GiB compose soak (count-based, HTTP /v1/extract, default env) ==="
set +e
SOAK_JSON="$("${COMPOSE[@]}" exec -T worker \
  python tests/scripts/worker_compose_2g_soak.py \
  --base-url "http://127.0.0.1:8000" \
  --passes "${WORKER_SOAK_PASSES:-3}" \
  --overall-timeout-minutes "${WORKER_SOAK_TIMEOUT_MINUTES:-90}")"
SOAK_RC=$?
set -e
echo "${SOAK_JSON}"

RESTARTS_AFTER="$(docker inspect -f '{{.RestartCount}}' "${WORKER_CID}")"
if [ "${RESTARTS_AFTER}" != "${RESTARTS_BEFORE}" ]; then
  echo "worker RestartCount changed ${RESTARTS_BEFORE} -> ${RESTARTS_AFTER}" >&2
  exit 5
fi

OOM_KILLED_STATE="$(docker inspect -f '{{.State.OOMKilled}}' "${WORKER_CID}")"
echo "worker_soak_restarts=$((RESTARTS_AFTER - RESTARTS_BEFORE)) worker_container_oom_killed=${OOM_KILLED_STATE}"
if [ "${OOM_KILLED_STATE}" != "false" ]; then
  echo "worker container was OOM-killed" >&2
  exit 6
fi

# Exit codes from the soak: 3 not all docs attempted in time, 4 untyped failure,
# 6 cgroup OOM kill, 7 peak memory reached the cgroup limit.
exit "${SOAK_RC}"
