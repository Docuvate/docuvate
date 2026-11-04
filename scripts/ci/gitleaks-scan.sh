#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
#
# Secret scanning with a pinned, checksum-verified gitleaks binary.
#   gitleaks-scan.sh diff <base-ref>  -> scans commits <base-ref>..HEAD, fails on findings
#   gitleaks-scan.sh history          -> scans the whole git history, reports only (never fails)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VERSION="8.24.3"
SHA256="9991e0b2903da4c8f6122b5c3186448b927a5da4deef1fe45271c3793f4ee29c"
BIN_DIR="${GITLEAKS_CACHE_DIR:-$HOME/.cache/gitleaks/$VERSION}"
BIN="$BIN_DIR/gitleaks"

if [ ! -x "$BIN" ]; then
  mkdir -p "$BIN_DIR"
  tarball="$BIN_DIR/gitleaks.tar.gz"
  curl -fsSL -o "$tarball" \
    "https://github.com/gitleaks/gitleaks/releases/download/v${VERSION}/gitleaks_${VERSION}_linux_x64.tar.gz"
  echo "${SHA256}  ${tarball}" | sha256sum -c -
  tar -xzf "$tarball" -C "$BIN_DIR" gitleaks
  rm -f "$tarball"
fi

cd "$ROOT"
mode="${1:-}"
case "$mode" in
  diff)
    base="${2:?usage: gitleaks-scan.sh diff <base-ref>}"
    "$BIN" git --config .gitleaks.toml --redact --no-banner --log-opts="${base}..HEAD" .
    ;;
  history)
    "$BIN" git --config .gitleaks.toml --redact --no-banner --exit-code 0 .
    ;;
  *)
    echo "usage: gitleaks-scan.sh diff <base-ref> | history" >&2
    exit 2
    ;;
esac
