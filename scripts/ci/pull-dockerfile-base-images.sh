#!/usr/bin/env bash
# Pre-pull Docker Hub *library* bases used in service Dockerfiles (ECR mirror).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
exec bash scripts/ci/docker-pull-with-retry.sh \
  node:24.21.0-alpine \
  nginx:alpine \
  python:3.12.15-slim \
  golang:1.26.9-bookworm@sha256:bcef992b77b1e2031aaaa51da75cebc32da8e9c182e12e633ea79023c79d9eff \
  alpine:3.20@sha256:c64c687cbea9300178b30c95835354e34c4e4febc4badfe27102879de0483b5e
