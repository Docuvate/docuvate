#!/usr/bin/env bash
# Retry docker pull (CI Docker Hub rate limits).
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "usage: docker-pull-with-retry.sh <image> [<image> ...]" >&2
  exit 2
fi

for image in "$@"; do
  for attempt in 1 2 3 4 5; do
    if docker pull "$image"; then
      break
    fi
    if [ "$attempt" -eq 5 ]; then
      echo "docker pull failed after 5 attempts: ${image}" >&2
      exit 1
    fi
    echo "docker pull failed (attempt ${attempt}), retrying ${image}…" >&2
    sleep $((attempt * 20))
  done
done
