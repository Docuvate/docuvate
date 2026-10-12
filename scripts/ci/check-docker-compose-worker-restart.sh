#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
compose="$root/docker-compose.yml"

if ! grep -A2 '^  worker:' "$compose" | grep -q 'restart: unless-stopped'; then
  echo "docker-compose.yml: worker service must set restart: unless-stopped" >&2
  exit 1
fi

if ! grep -A5 '^  worker:' "$compose" | grep -q 'mem_limit:'; then
  echo "docker-compose.yml: worker service must set mem_limit" >&2
  exit 1
fi

echo "worker restart policy and memory limit OK"
