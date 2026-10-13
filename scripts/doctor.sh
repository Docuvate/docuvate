#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose.yml)
WEB_URL="${DOCUVATE_DOCTOR_WEB_URL:-http://localhost:5173}"
API_READY_URL="${DOCUVATE_DOCTOR_API_READY_URL:-http://localhost:3001/health/ready}"
WORKER_HEALTH_URL="${DOCUVATE_DOCTOR_WORKER_URL:-http://localhost:8000/v1/health}"
OLLAMA_MODEL="${OLLAMA_MODEL:-qwen2.5:1.5b}"

failures=0
warn() { echo "WARN: $*"; }
ok() { echo "OK: $*"; }
bad() { echo "FAIL: $*"; failures=$((failures + 1)); }

section() { echo ""; echo "== $* =="; }

section "Docker"
if ! command -v docker >/dev/null 2>&1; then
  bad "docker not found"
else
  ok "docker CLI present"
fi
if ! docker info >/dev/null 2>&1; then
  bad "docker daemon not running"
else
  ok "docker daemon running"
fi

section "Compose services"
if ! docker compose version >/dev/null 2>&1; then
  bad "docker compose v2 missing"
else
  "${COMPOSE[@]}" ps --format 'table {{.Name}}\t{{.Status}}\t{{.Health}}' || bad "docker compose ps failed"
fi

section "HTTP health"
if curl -fsS "$API_READY_URL" >/dev/null 2>&1; then
  ok "API ready ($API_READY_URL)"
else
  bad "API not ready ($API_READY_URL)"
fi

if curl -fsS "$WORKER_HEALTH_URL" >/dev/null 2>&1; then
  ok "Worker reachable ($WORKER_HEALTH_URL)"
else
  bad "Worker not reachable ($WORKER_HEALTH_URL)"
fi

if curl -fsS "$WEB_URL" >/dev/null 2>&1; then
  ok "Web reachable ($WEB_URL)"
else
  bad "Web not reachable ($WEB_URL)"
fi

section "Database migrations"
migrate_code="$("${COMPOSE[@]}" ps -a migrate --format '{{.ExitCode}}' 2>/dev/null || echo "")"
if [[ "$migrate_code" == "0" ]]; then
  ok "migrate service exited 0"
elif [[ -z "$migrate_code" ]]; then
  warn "migrate service not found (stack not started?)"
else
  bad "migrate service exit code ${migrate_code} (run: docker compose logs migrate)"
fi

section "Embedding coverage"
pg_user="${POSTGRES_USER:-docuvate}"
pg_db="${POSTGRES_DB:-docuvate}"
embedding_line="$("${COMPOSE[@]}" exec -T postgres psql -U "$pg_user" -d "$pg_db" -Atqc \
  "SELECT COUNT(*) FILTER (WHERE vector_int8 IS NOT NULL), COUNT(*) FROM document_text_chunks;" 2>/dev/null || true)"
if [[ -n "$embedding_line" ]]; then
  with_vectors="${embedding_line%%|*}"
  total="${embedding_line##*|}"
  if [[ "${total:-0}" == "0" ]]; then
    warn "no document_text_chunks yet (upload documents to build embeddings)"
  else
    pct=$((with_vectors * 100 / total))
    ok "chunks with vectors: ${with_vectors}/${total} (${pct}%)"
    if [[ "$pct" -lt 80 ]]; then
      warn "embedding coverage below 80% — check worker logs and representation pipeline"
    fi
  fi
else
  bad "could not query embedding coverage (is postgres up?)"
fi

section "Ollama model"
if "${COMPOSE[@]}" ps --status running ollama --format '{{.Name}}' 2>/dev/null | grep -q ollama; then
  if "${COMPOSE[@]}" exec -T ollama ollama list 2>/dev/null | grep -q "$OLLAMA_MODEL"; then
    ok "Ollama model pulled: $OLLAMA_MODEL"
  else
    bad "Ollama running but model $OLLAMA_MODEL not listed (wait for ollama-init or run: docker compose logs ollama-init)"
  fi
else
  warn "ollama service not running (chat may be unavailable)"
fi

section "Host resources"
if command -v df >/dev/null 2>&1; then
  df -h . | tail -n 1 | awk '{print "Disk (workspace mount): " $4 " free on " $1}' || true
fi
if command -v free >/dev/null 2>&1; then
  free -h | awk '/^Mem:/ {print "RAM: " $3 " used / " $2 " total (" $7 " available)"}'
fi

section "CE feature flags (API)"
if flags="$(curl -fsS http://localhost:3001/v1/settings/ce 2>/dev/null)"; then
  ok "GET /v1/settings/ce → $flags"
else
  warn "could not read CE flags from API"
fi

echo ""
if [[ "$failures" -gt 0 ]]; then
  echo "Doctor finished with $failures failure(s). See messages above."
  echo "Fix hints: docs/self-hosting.md · bash scripts/quickstart.sh"
  exit 1
fi
echo "Doctor: all checks passed."
exit 0
