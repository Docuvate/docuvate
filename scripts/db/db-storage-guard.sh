#!/bin/sh
set -eu

PGHOST=${PGHOST:-postgres}
PGUSER=${PGUSER:-${POSTGRES_USER:-docuvate}}
PGPASSWORD=${PGPASSWORD:-${POSTGRES_PASSWORD:-docuvate}}
PGDATABASE=${PGDATABASE:-${POSTGRES_DB:-docuvate}}
MINIO_ENDPOINT=${MINIO_ENDPOINT:-http://minio:9000}
BUCKET=${MINIO_BUCKET:-documents}

export PGPASSWORD

log() { printf '[db-storage-guard] %s\n' "$*"; }
log_de() { printf '[db-storage-guard/de] %s\n' "$*"; }
die() { log "$1"; log_de "$2"; exit 1; }

doc_count=$(psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -Atqc \
  "SELECT CASE WHEN to_regclass('public.documents') IS NULL THEN 0 ELSE (SELECT count(*)::bigint FROM documents) END;" 2>/dev/null || echo 0)

# Existence probe (not a full inventory): any object under the bucket prefix.
minio_bucket_nonempty=no
if command -v aws >/dev/null 2>&1; then
  if aws --endpoint-url "$MINIO_ENDPOINT" s3 ls "s3://${BUCKET}/" --recursive 2>/dev/null | head -1 | grep -q .; then
    minio_bucket_nonempty=yes
  fi
fi

if [ "$doc_count" -eq 0 ] && [ "$minio_bucket_nonempty" = "yes" ]; then
  if [ "${DOCUVATE_FRESH_STACK:-0}" = "1" ]; then
    log "DOCUVATE_FRESH_STACK=1: allowing empty Postgres while MinIO bucket \"${BUCKET}\" still has objects (fresh DB; orphaned MinIO keys may remain)."
    log "OK: documents=${doc_count}, minio_bucket_nonempty=${minio_bucket_nonempty} (existence check)"
    exit 0
  fi
  die \
    "Database has 0 documents but MinIO bucket \"${BUCKET}\" is non-empty (existence check). Likely wrong Postgres volume after a Compose project rename. Attach the correct volume or set DOCUVATE_FRESH_STACK=1 for an intentional empty database (see docs/self-hosting.md)." \
    "0 Dokumente in Postgres, MinIO nicht leer — korrektes Volume anbinden oder DOCUVATE_FRESH_STACK=1 (docs/self-hosting.md)."
fi

log "OK: documents=${doc_count}, minio_bucket_nonempty=${minio_bucket_nonempty} (existence check)"
