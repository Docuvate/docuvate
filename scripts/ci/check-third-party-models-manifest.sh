#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MANIFEST="$ROOT/third-party-models.manifest.json"

if [[ ! -f "$MANIFEST" ]]; then
  echo "Missing third-party-models.manifest.json"
  exit 1
fi

cd "$ROOT"
python3 - <<PY
import hashlib
import json
import sys
from pathlib import Path

root = Path("$ROOT")
manifest_path = root / "third-party-models.manifest.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
artifacts = manifest.get("artifacts")
if not isinstance(artifacts, list):
    print("manifest artifacts must be a list", file=sys.stderr)
    sys.exit(1)

exit_code = 0
for entry in artifacts:
    if not isinstance(entry, dict):
        exit_code = 1
        continue
    rel = entry.get("path")
    expected = entry.get("sha256")
    artifact_id = entry.get("id", rel)
    if not isinstance(rel, str) or not isinstance(expected, str):
        print(f"invalid manifest entry for {artifact_id}", file=sys.stderr)
        exit_code = 1
        continue
    path = root / rel
    if not path.is_file():
        print(f"missing artifact file {rel} for {artifact_id}", file=sys.stderr)
        exit_code = 1
        continue
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest != expected.lower():
        print(
            f"sha256 mismatch for {artifact_id}: expected {expected}, got {digest}",
            file=sys.stderr,
        )
        exit_code = 1
    else:
        print(f"OK {artifact_id} sha256 {digest}")

sys.exit(exit_code)
PY
