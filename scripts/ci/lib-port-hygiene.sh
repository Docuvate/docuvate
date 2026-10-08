#!/usr/bin/env bash
# Port and compose project hygiene for scripts/ci/run-local-ci-jobs.sh (one runner instance).

: "${DOCUVATE_LOCAL_CI_RUN_ID:?DOCUVATE_LOCAL_CI_RUN_ID must be set}"

DOCUVATE_CI_OWN_COMPOSE_PROJECTS=()
DOCUVATE_CI_OWN_CONTAINER_IDS=()

docuvate_ci_compose_project_name() {
  local job_slug="$1"
  echo "docuvate_lc_${DOCUVATE_LOCAL_CI_RUN_ID}_${job_slug}"
}

docuvate_ci_register_compose_project() {
  local project="$1"
  local existing
  for existing in "${DOCUVATE_CI_OWN_COMPOSE_PROJECTS[@]}"; do
    if [[ "$existing" == "$project" ]]; then
      return 0
    fi
  done
  DOCUVATE_CI_OWN_COMPOSE_PROJECTS+=("$project")
}

docuvate_ci_register_container() {
  DOCUVATE_CI_OWN_CONTAINER_IDS+=("$1")
}

docuvate_ci_port_holder() {
  local port="$1"
  local line id names ports
  while IFS=$'\t' read -r id names ports; do
    [[ -z "$id" ]] && continue
    if [[ "$ports" == *":${port}->"* ]] || [[ "$ports" == *":${port}/"* ]] || [[ "$ports" == *"127.0.0.1:${port}->"* ]]; then
      echo "container ${names} (${id}) publishes host port ${port} (${ports})"
      return 0
    fi
  done < <(docker ps --format '{{.ID}}\t{{.Names}}\t{{.Ports}}' 2>/dev/null || true)
  if command -v ss >/dev/null 2>&1; then
    if ss -ltn 2>/dev/null | awk '{print $4}' | grep -qE ":${port}\$"; then
      echo "non-Docker listener (ss shows port ${port} in use; no matching docker ps publish line)"
      return 0
    fi
  fi
  return 1
}

docuvate_ci_assert_ports_free() {
  local job_name="${DOCUVATE_CI_JOB_NAME:-local-ci job}"
  local port holder
  for port in "$@"; do
    if holder="$(docuvate_ci_port_holder "$port")"; then
      echo "local-ci: ${job_name} requires host port ${port} to be free" >&2
      echo "local-ci: port ${port} is held by: ${holder}" >&2
      exit 1
    fi
  done
}

docuvate_ci_compose_cmd() {
  local project="$1"
  shift
  docker compose --progress plain -p "$project" "$@"
}

docuvate_ci_compose_file_args() {
  printf '%s\0' \
    -f "$ROOT/docker-compose.yml" \
    -f "$ROOT/docker-compose.ci.yml" \
    -f "$ROOT/scripts/ci/docker-compose.local-ci.yml"
}

docuvate_ci_compose_down_owned() {
  local project="$1"
  local remove_volumes="${2:-0}"
  local -a files=()
  while IFS= read -r -d '' f; do files+=("$f"); done < <(docuvate_ci_compose_file_args)
  if [[ "$remove_volumes" == "1" ]]; then
    docuvate_ci_compose_cmd "$project" "${files[@]}" down --rmi local -v --remove-orphans 2>/dev/null || true
  else
    docuvate_ci_compose_cmd "$project" "${files[@]}" down --remove-orphans 2>/dev/null || true
  fi
}

docuvate_ci_stack_compose_project() {
  docuvate_ci_compose_project_name "stack"
}

docuvate_ci_prepare_stack_compose() {
  local project
  project="$(docuvate_ci_stack_compose_project)"
  export COMPOSE_PROJECT_NAME="$project"
  export DOCUVATE_LOCAL_CI_IMAGE_TAG="${DOCUVATE_LOCAL_CI_RUN_ID}"
  docuvate_ci_register_compose_project "$project"
  echo "$project"
}

docuvate_ci_stop_owned_containers() {
  local cid
  for cid in "${DOCUVATE_CI_OWN_CONTAINER_IDS[@]}"; do
    docker stop "$cid" >/dev/null 2>&1 || true
  done
  local labeled
  while read -r labeled; do
    [[ -z "$labeled" ]] && continue
    docker stop "$labeled" >/dev/null 2>&1 || true
  done < <(docker ps -q --filter "label=docuvate.local-ci.run-id=${DOCUVATE_LOCAL_CI_RUN_ID}" 2>/dev/null || true)
}

docuvate_ci_runner_cleanup() {
  local project
  for project in "${DOCUVATE_CI_OWN_COMPOSE_PROJECTS[@]}"; do
    docuvate_ci_compose_down_owned "$project" 1
  done
  docuvate_ci_stop_owned_containers
}

docuvate_ci_pre_job() {
  local job_name="$1"
  DOCUVATE_CI_JOB_NAME="$job_name"
}
