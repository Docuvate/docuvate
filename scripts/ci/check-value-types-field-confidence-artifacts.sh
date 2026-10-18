#!/usr/bin/env bash
# Fail when API and worker copies of the calibrated field-confidence artifact drift.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORKER="${ROOT}/apps/worker/src/docuvate_worker/infrastructure/ml/artifacts/value-types-field-confidence.v1.json"
API="${ROOT}/apps/api/src/modules/documents/domain/artifacts/value-types-field-confidence.v1.json"
for path in "$WORKER" "$API"; do
  if [[ ! -f "$path" ]]; then
    echo "missing value-types-field-confidence artifact: $path" >&2
    exit 1
  fi
done
if ! cmp -s "$WORKER" "$API"; then
  echo "value-types-field-confidence artifact out of sync (worker vs api)" >&2
  exit 1
fi
