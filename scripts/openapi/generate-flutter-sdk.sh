#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/packages/sdk-flutter/lib/src/generated"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pnpm exec openapi-generator-cli generate \
  -i "$ROOT/openapi/docuvate.v1.json" \
  -g dart-dio \
  -o "$TMP" \
  --additional-properties=pubName=docuvate_api,nullableFields=true,useEnumExtension=true

rm -rf "$OUT"
mkdir -p "$OUT"
mv "$TMP/lib/"* "$OUT/"

find "$OUT" -name '*.dart' -print0 | while IFS= read -r -d '' f; do
  sed -i 's|package:docuvate_api/|package:docuvate/src/generated/|g' "$f"
done

rm -rf "$OUT/doc" "$OUT/test" "$OUT/README.md" "$OUT/pubspec.yaml" "$OUT/analysis_options.yaml" "$OUT/.gitignore" 2>/dev/null || true

FLUTTER_BIN="${FLUTTER_BIN:-flutter}"
if ! command -v "$FLUTTER_BIN" >/dev/null 2>&1; then
  echo "generate-flutter-sdk: $FLUTTER_BIN not found; run build_runner in packages/sdk-flutter before dart analyze" >&2
  exit 1
fi

(cd "$ROOT/packages/sdk-flutter" && "$FLUTTER_BIN" pub get && dart run build_runner build --delete-conflicting-outputs)
