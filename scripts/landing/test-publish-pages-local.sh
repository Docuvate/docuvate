#!/usr/bin/env bash
# Simulate docuvate.github.io rules: existing main commit, linear history, no force push.
# Runs publish-pages.sh against a local bare remote (does not touch GitHub).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BARE="${PAGES_TEST_BARE:-/tmp/docuvate-pages-test.git}"
INIT="${PAGES_TEST_INIT:-/tmp/docuvate-pages-init}"
CLONE="${PAGES_TEST_CLONE:-/tmp/docuvate-pages-clone}"

rm -rf "$BARE" "$INIT" "$CLONE"
mkdir -p "$BARE"
git init --bare "$BARE"

git clone "$BARE" "$INIT"
cd "$INIT"
git checkout -b main
printf '%s\n' '# docuvate.github.io' '' 'Initial placeholder (ruleset test).' > README.md
git add README.md
git commit -m "Initial commit"
git push -u origin main

echo "== First publish (should add site + replace README) =="
PUBLISH=1 \
  GITHUB_PAGES_REMOTE="$BARE" \
  GITHUB_PAGES_CLONE_DIR="$CLONE" \
  STAGING_DIR="${STAGING_DIR:-/tmp/docuvate-pages-staging}" \
  "$ROOT/scripts/landing/publish-pages.sh"

cd "$CLONE"
test "$(git rev-parse --abbrev-ref HEAD)" = main
test -f .nojekyll
test -f index.html
test -f README.md
grep -q 'docuvate.de' README.md
commits="$(git rev-list --count main)"
test "$commits" -ge 2

echo "== Second publish (no-op or fast-forward only) =="
PUBLISH=1 \
  GITHUB_PAGES_REMOTE="$BARE" \
  GITHUB_PAGES_CLONE_DIR="$CLONE" \
  STAGING_DIR="${STAGING_DIR:-/tmp/docuvate-pages-staging-2}" \
  "$ROOT/scripts/landing/publish-pages.sh"

git log --oneline -3
echo "OK: local bare-repo publish test passed (linear main, no force)."
