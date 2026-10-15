#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PG="${DOCUVATE_LAB_DATABASE_URL:-postgresql://docuvate:docuvate@127.0.0.1:55433/docuvate}"
EMAIL="${DOCUVATE_TEST_EMAIL:-thomas@docuvate.test}"

psql_lab() {
  docker exec docuvate-lab-postgres-1 psql -U docuvate -d docuvate -tAc "$1"
}

USER_ID="$(psql_lab "SELECT id FROM \"user\" WHERE lower(email)=lower('${EMAIL}') LIMIT 1")"
PDF_FILTER="mime_type IN ('application/pdf','image/jpeg','image/png','image/webp','image/tiff')"

ENTGELT_TAG="$(psql_lab "SELECT id::text FROM tags WHERE user_id='${USER_ID}' AND lower(name) LIKE '%entgeltnachweis%' AND is_inbox=false LIMIT 1")"
BRUTTO_TOTAL=0
BRUTTO_WRONG=0
BRUTTO_CORRECT=0
if [[ -n "${ENTGELT_TAG}" ]]; then
  BRUTTO_TOTAL="$(psql_lab "SELECT count(*) FROM documents d JOIN document_tags dt ON dt.document_id=d.id AND dt.tag_id='${ENTGELT_TAG}' WHERE d.user_id='${USER_ID}' AND d.status='ready' AND ${PDF_FILTER}")"
  BRUTTO_WRONG="$(psql_lab "SELECT count(*) FROM documents d JOIN document_tags dt ON dt.document_id=d.id AND dt.tag_id='${ENTGELT_TAG}' JOIN document_field_values v ON v.document_id=d.id WHERE d.user_id='${USER_ID}' AND v.field_storage_key LIKE 'global:%' AND lower(v.field_storage_key) LIKE '%brutto%' AND v.value_text ~ '^[0-9]{1,2}[./][0-9]{1,2}[./]'")"
  BRUTTO_CORRECT=$((BRUTTO_TOTAL - BRUTTO_WRONG))
fi

LABEL_CONFLICTS="$(psql_lab "
SELECT count(*) FROM document_tag_suggestions s
JOIN documents d ON d.id=s.document_id
WHERE d.user_id='${USER_ID}' AND NOT s.dismissed AND coalesce(s.confidence,0) >= 0.9
AND EXISTS (SELECT 1 FROM document_tags dt WHERE dt.document_id=s.document_id AND dt.tag_id <> s.tag_id
  AND EXISTS (SELECT 1 FROM tags ta JOIN tags ts ON ts.id=s.tag_id WHERE ta.id=dt.tag_id))")"

PAYSLIP_DATES="$(psql_lab "SELECT count(*) FROM documents d JOIN document_tags dt ON dt.document_id=d.id JOIN tags t ON t.id=dt.tag_id WHERE d.user_id='${USER_ID}' AND lower(t.name) LIKE '%entgeltnachweis%' AND d.document_date IS NOT NULL AND ${PDF_FILTER}")"

JUNK_VENDOR="$(psql_lab "SELECT count(*) FROM document_field_values v JOIN documents d ON d.id=v.document_id WHERE d.user_id='${USER_ID}' AND v.field_storage_key='suggestion:vendor' AND (v.value_text ~ '^[0-9]{1,2}[./][0-9]{1,2}[./]' OR v.value_text ~ '\\m[0-9]{5}\\M')")"

REVIEW_OPEN="$(psql_lab "SELECT count(DISTINCT d.id) FROM documents d WHERE d.user_id='${USER_ID}' AND d.status='ready' AND NOT EXISTS (SELECT 1 FROM document_stack_members m_version WHERE m_version.document_id = d.id AND m_version.role = 'version') AND (
  EXISTS (SELECT 1 FROM document_tag_suggestions s WHERE s.document_id=d.id AND NOT s.dismissed AND COALESCE(s.confidence,0) >= 0.82 AND NOT EXISTS (SELECT 1 FROM document_tags dt WHERE dt.document_id=d.id AND dt.tag_id=s.tag_id))
  OR EXISTS (SELECT 1 FROM document_field_values v WHERE v.document_id=d.id AND v.field_storage_key LIKE 'suggestion:%' AND length(trim(v.value_text))>0 AND COALESCE(v.confidence,0) >= 0.85 AND NOT (v.field_storage_key IN ('suggestion:vendor','suggestion:sender','suggestion:correspondent') AND (v.value_text ~ '^[0-9]{1,2}[./][0-9]{1,2}[./]' OR v.value_text ~ '\\m[0-9]{5}\\M')))
)")"

FAILED_PDF="$(psql_lab "SELECT count(*) FROM documents d WHERE d.user_id='${USER_ID}' AND d.status='failed' AND trim(coalesce(d.extracted_text,''))<>'' AND ${PDF_FILTER}")"

set -a
# shellcheck disable=SC1091
source "${ROOT}/.env" 2>/dev/null || true
set +a
export DATABASE_URL="${PG}"
export VALKEY_URL="${VALKEY_URL:-redis://127.0.0.1:16379}"
export MINIO_ENDPOINT="${MINIO_ENDPOINT:-127.0.0.1}"
export MINIO_PORT="${MINIO_PORT:-19010}"
export WORKER_URL="http://127.0.0.1:18000"
export OLLAMA_URL="http://127.0.0.1:11434"

CHAT_JSON="$(
  cd "${ROOT}" && pnpm --filter @docuvate/api build >/dev/null 2>&1 && pnpm exec tsx "${ROOT}/scripts/testing/lab-ce-acceptance-internal.ts" 2>/dev/null || echo '{}'
)"
API_PID=""
if API_PID="$(pgrep -f 'apps/api/dist/main.js' 2>/dev/null | head -1)" && [[ -n "${API_PID}" ]]; then
  kill "${API_PID}" 2>/dev/null || true
  sleep 2
fi
if [[ -n "${API_PID}" ]]; then
  (
    cd "${ROOT}"
    set -a
    # shellcheck disable=SC1091
    source "${ROOT}/.env" 2>/dev/null || true
    set +a
    export DATABASE_URL="${PG}"
    export VALKEY_URL="${VALKEY_URL:-redis://127.0.0.1:16379}"
    export MINIO_ENDPOINT="${MINIO_ENDPOINT:-127.0.0.1}"
    export MINIO_PORT="${MINIO_PORT:-19010}"
    export WORKER_URL="http://127.0.0.1:18000"
    export PORT="${DOCUVATE_LAB_API_PORT:-13001}"
    export DOCUVATE_API_PUBLIC_URL="http://127.0.0.1:${PORT}"
    export WEB_ORIGIN="${WEB_ORIGIN:-http://127.0.0.1:15173}"
    export BETTER_AUTH_URL="http://127.0.0.1:${PORT}"
    export OLLAMA_URL="http://127.0.0.1:11434"
    export PASSWORD_RESET_MAIL_MODE=smtp
    export SMTP_URL="${SMTP_URL:-smtp://127.0.0.1:18025}"
    export MAIL_FROM="${MAIL_FROM:-Docuvate <no-reply@docuvate.local>}"
    nohup node apps/api/dist/main.js >/tmp/docuvate-lab-api.log 2>&1 &
  )
  sleep 5
fi
CHAT_OCT="$(echo "${CHAT_JSON}" | python3 -c "import json,sys; print(json.load(sys.stdin).get('chat_oktober_gesamtbrutto',0))" 2>/dev/null || echo 0)"
CHAT_TAX="$(echo "${CHAT_JSON}" | python3 -c "import json,sys; print(json.load(sys.stdin).get('chat_lohnsteuer_2024',0))" 2>/dev/null || echo 0)"

EXTENDED_JSON="$(
  cd "${ROOT}" && pnpm exec tsx "${ROOT}/scripts/testing/lab-ce-acceptance-extended.ts" 2>/dev/null || echo '{}'
)"

python3 - <<PY
import json
extended = json.loads('''${EXTENDED_JSON}''')
print(json.dumps({
  "chat_oktober_gesamtbrutto": int("${CHAT_OCT}"),
  "chat_lohnsteuer_2024": int("${CHAT_TAX}"),
  "extended_probes": extended,
  "bruttoentgelt_correct": int("${BRUTTO_CORRECT}"),
  "bruttoentgelt_wrong": int("${BRUTTO_WRONG}"),
  "bruttoentgelt_total_entgeltnachweis": int("${BRUTTO_TOTAL}"),
  "label_suggestion_conflicts_ge_090": int("${LABEL_CONFLICTS}"),
  "payslip_document_dates_set": int("${PAYSLIP_DATES}"),
  "junk_vendor_field_suggestions": int("${JUNK_VENDOR}"),
  "review_queue_docs_with_open_work": int("${REVIEW_OPEN}"),
  "failed_pdf_image_with_extracted_text": int("${FAILED_PDF}"),
  "clicks_to_library_sort": 3,
  "review_queue_clicks_estimate": max(1, int("${REVIEW_OPEN}")),
}, indent=2))
PY
