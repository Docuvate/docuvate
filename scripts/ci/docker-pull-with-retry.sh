#!/usr/bin/env bash
# Retry docker pull (CI Docker Hub rate limits). Official library images use the ECR public mirror first.
set -euo pipefail

library_mirror_ref() {
  local image="$1"
  if [[ "$image" == */* ]]; then
    return 1
  fi
  if [[ "$image" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]*(@sha256:[a-f0-9]{64}|:[^/]+)$ ]]; then
    printf 'public.ecr.aws/docker/library/%s' "$image"
    return 0
  fi
  return 1
}

pull_one() {
  local image="$1"
  local mirror=""
  if mirror="$(library_mirror_ref "$image" 2>/dev/null)"; then
    :
  else
    mirror=""
  fi

  for attempt in 1 2 3 4 5; do
    local refs=()
    if [[ -n "$mirror" ]]; then
      refs+=("$mirror")
    fi
    refs+=("$image")

    for ref in "${refs[@]}"; do
      if docker pull "$ref"; then
        if [[ "$ref" != "$image" ]]; then
          docker tag "$ref" "$image"
        fi
        return 0
      fi
    done

    if [ "$attempt" -eq 5 ]; then
      echo "docker pull failed after 5 attempts: ${image}" >&2
      return 1
    fi
    echo "docker pull failed (attempt ${attempt}), retrying ${image}…" >&2
    sleep $((attempt * 20))
  done
}

if [ "$#" -lt 1 ]; then
  echo "usage: docker-pull-with-retry.sh <image> [<image> ...]" >&2
  exit 2
fi

for image in "$@"; do
  pull_one "$image"
done
