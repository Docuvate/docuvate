#!/usr/bin/env bash
# Build the static marketing site and (optionally) push to Docuvate/docuvate.github.io.
# Default: dry-run staging only. Never pushes unless PUBLISH=1.
#
# The public repo ruleset blocks force-push and branch deletion and requires linear
# history. This script only ever fast-forwards main: clone/pull, replace tree (keep
# .git), commit, push (no --force, no orphan branch).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SITE_DIST="$ROOT/apps/site/dist"
STAGING="${STAGING_DIR:-$(mktemp -d)}"
INCLUDE_CNAME="${INCLUDE_CNAME:-0}"
PUBLISH="${PUBLISH:-0}"
GITHUB_PAGES_REMOTE="${GITHUB_PAGES_REMOTE:-git@github.com:Docuvate/docuvate.github.io.git}"
CLONE_DIR="${GITHUB_PAGES_CLONE_DIR:-$ROOT/.cache/docuvate.github.io}"
PAGES_README="$ROOT/scripts/landing/pages-root-README.md"

echo "== Build @docuvate/site (static, base /) =="
cd "$ROOT"
pnpm --filter @docuvate/site build

if [[ ! -f "$SITE_DIST/index.html" ]]; then
  echo "Missing $SITE_DIST/index.html after build" >&2
  exit 1
fi

echo "== Stage GitHub Pages output in $STAGING =="
rm -rf "$STAGING"
mkdir -p "$STAGING"
for item in "$SITE_DIST"/*; do
  base="$(basename "$item")"
  if [[ "$base" == "server" || "$base" == "client" ]]; then
    continue
  fi
  cp -a "$item" "$STAGING/"
done
touch "$STAGING/.nojekyll"
cp "$PAGES_README" "$STAGING/README.md"
if [[ "$INCLUDE_CNAME" == "1" ]]; then
  printf '%s\n' 'docuvate.de' > "$STAGING/CNAME"
  echo "Wrote CNAME docuvate.de"
else
  echo "Skipping CNAME (set INCLUDE_CNAME=1 for custom domain)"
fi

echo "== Staging safety (paths, stacks, no client/) =="
node "$ROOT/scripts/landing/check-pages-staging.mjs" "$STAGING"

echo "== Secret scan (gitleaks) =="
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks detect --no-git --source "$STAGING" --config "$ROOT/scripts/landing/gitleaks-pages.toml" --redact --verbose
else
  echo "gitleaks not installed; install from https://github.com/gitleaks/gitleaks" >&2
  exit 1
fi

echo "== Staging ready: $STAGING =="
find "$STAGING" -maxdepth 2 -type f | head -30

if [[ "$PUBLISH" == "1" ]]; then
  echo "== Legal config (impressum required fields) =="
  node "$ROOT/apps/site/scripts/check-legal-for-publish.mjs"
fi

if [[ "$PUBLISH" != "1" ]]; then
  echo "Dry run complete (PUBLISH=0). Review staging dir, then:"
  echo "  INCLUDE_CNAME=0 PUBLISH=1 $0"
  echo "  INCLUDE_CNAME=1 PUBLISH=1 $0   # docuvate.de (fill apps/site/legal.config.json first)"
  if [[ "$INCLUDE_CNAME" == "1" && -f "$STAGING/CNAME" ]]; then
    echo "CNAME in staging: $(cat "$STAGING/CNAME")"
  fi
  echo "Local ruleset simulation: scripts/landing/test-publish-pages-local.sh"
  exit 0
fi

mkdir -p "$(dirname "$CLONE_DIR")"
if [[ ! -d "$CLONE_DIR/.git" ]]; then
  git clone "$GITHUB_PAGES_REMOTE" "$CLONE_DIR"
fi

cd "$CLONE_DIR"
git fetch origin
git checkout main
git pull --ff-only origin main

echo "== Replace working tree (keep .git) =="
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
cp -a "$STAGING/." .

git add -A
if git diff --staged --quiet; then
  echo "No changes to publish."
  exit 0
fi

MONO_SHA="$(git -C "$ROOT" rev-parse --short HEAD)"
git commit -m "Publish site from docuvate monorepo ${MONO_SHA}"

echo "== Push main (fast-forward only, no --force) =="
git push origin main
echo "Published to $GITHUB_PAGES_REMOTE (branch main)"
