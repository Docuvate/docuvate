#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-}"
if [[ -z "$VERSION" ]]; then
  echo "Usage: $0 <semver matching openapi info.version>" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
node -e "
const fs=require('fs');
const path=require('path');
const root=process.argv[1];
const v=process.argv[2];
for (const pkg of ['packages/sdk-node/package.json','packages/sdk-flutter/pubspec.yaml']) {
  const p=path.join(root,pkg);
  let s=fs.readFileSync(p,'utf8');
  if (p.endsWith('.json')) {
    const j=JSON.parse(s);
    j.version=v;
    fs.writeFileSync(p, JSON.stringify(j,null,2)+'\n');
  } else {
    s=s.replace(/^version: .*/m, 'version: '+v);
    fs.writeFileSync(p,s);
  }
}
" "$ROOT" "$VERSION"

echo "SDK versions set to $VERSION (no publish step)"
