#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MANIFEST="$ROOT/third-party-models.manifest.json"
HEAD_REL="apps/worker/src/docuvate_worker/infrastructure/ml/artifacts/layout-kv-role-head.v1.json"
HEAD_PATH="$ROOT/$HEAD_REL"

if [[ ! -f "$HEAD_PATH" ]]; then
  echo "missing head artifact: $HEAD_PATH" >&2
  exit 1
fi

sha256="$(sha256sum "$HEAD_PATH" | awk '{print $1}')"
bytes="$(wc -c < "$HEAD_PATH" | tr -d ' ')"

python3 - <<PY
import json
from pathlib import Path

manifest_path = Path("$MANIFEST")
payload = json.loads(manifest_path.read_text(encoding="utf-8"))
models = payload.get("models")
if not isinstance(models, list):
    raise SystemExit("manifest.models must be a list")
updated = False
for entry in models:
    if entry.get("id") == "layout-kv-role-head":
        entry["path"] = "$HEAD_REL"
        entry["sha256"] = "$sha256"
        entry["bytes"] = int("$bytes")
        updated = True
        break
if not updated:
    raise SystemExit("layout-kv-role-head entry missing from manifest")
manifest_path.write_text(json.dumps(payload, indent=2) + "\\n", encoding="utf-8")
print(f"updated {manifest_path} sha256=$sha256 bytes=$bytes")
PY
