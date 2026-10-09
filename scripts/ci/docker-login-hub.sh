#!/usr/bin/env bash
# Optional Docker Hub login (secrets DOCKERHUB_USERNAME + DOCKERHUB_TOKEN) for CI pull limits.
set -euo pipefail
if [ -z "${DOCKERHUB_USERNAME:-}" ] || [ -z "${DOCKERHUB_TOKEN:-}" ]; then
  exit 0
fi
echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin docker.io
