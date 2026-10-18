#!/usr/bin/env bash
# Install a pinned typst CLI into a user-writable directory (no sudo).
# Prints typst_bin_dir=<path> on stdout for runners to prepend to PATH.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TOOL_VERSIONS="$ROOT/.tool-versions"
VERSION="$(grep 'docuvate:tool:typst=' "$TOOL_VERSIONS" | head -1 | cut -d= -f2)"

if [[ -z "${VERSION}" ]]; then
  echo "install-typst: missing docuvate:tool:typst in .tool-versions" >&2
  exit 1
fi

checksum_for_asset() {
  local asset="$1"
  grep -F "docuvate:tool:typst:checksum:${asset}=" "$TOOL_VERSIONS" | head -1 | cut -d= -f2
}

sha_verify() {
  local file="$1"
  local expected="$2"
  if command -v sha256sum >/dev/null 2>&1; then
    echo "${expected}  ${file}" | sha256sum -c -
  elif command -v shasum >/dev/null 2>&1; then
    echo "${expected}  ${file}" | shasum -a 256 -c -
  else
    echo "install-typst: need sha256sum or shasum" >&2
    exit 1
  fi
}

uname_s="$(uname -s)"
uname_m="$(uname -m)"
case "${uname_s}" in
  Linux)
    case "${uname_m}" in
      x86_64|amd64) ASSET="x86_64-unknown-linux-musl" ;;
      aarch64|arm64) ASSET="aarch64-unknown-linux-musl" ;;
      *) echo "install-typst: unsupported Linux arch ${uname_m}" >&2; exit 1 ;;
    esac
    ;;
  Darwin)
    case "${uname_m}" in
      x86_64) ASSET="x86_64-apple-darwin" ;;
      arm64|aarch64) ASSET="aarch64-apple-darwin" ;;
      *) echo "install-typst: unsupported Darwin arch ${uname_m}" >&2; exit 1 ;;
    esac
    ;;
  *)
    echo "install-typst: unsupported OS ${uname_s}" >&2
    exit 1
    ;;
esac

ARCHIVE="typst-${ASSET}.tar.xz"
CHECKSUM="$(checksum_for_asset "$ASSET")"
if [[ -z "${CHECKSUM}" ]]; then
  echo "install-typst: missing docuvate:tool:typst:checksum:${ASSET} in .tool-versions" >&2
  exit 1
fi

URL="https://github.com/typst/typst/releases/download/v${VERSION}/${ARCHIVE}"
CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/docuvate/typst/${VERSION}"
BIN_DIR="${CACHE_DIR}/bin"
mkdir -p "$BIN_DIR"

if command -v typst >/dev/null 2>&1 && typst --version 2>/dev/null | grep -q "${VERSION}"; then
  echo "typst_bin_dir=${BIN_DIR}"
  exit 0
fi

if [[ ! -x "${BIN_DIR}/typst" ]]; then
  TMP="${RUNNER_TEMP:-${TMPDIR:-/tmp}}/typst-${VERSION}-${ASSET}.tar.xz"
  curl -fsSL "$URL" -o "$TMP"
  sha_verify "$TMP" "$CHECKSUM"
  tar -xJf "$TMP" -C "${CACHE_DIR}" --strip-components=1 "typst-${ASSET}/typst"
  mv "${CACHE_DIR}/typst" "${BIN_DIR}/typst"
  chmod +x "${BIN_DIR}/typst"
fi

if [[ -n "${GITHUB_PATH:-}" ]]; then
  echo "${BIN_DIR}" >> "$GITHUB_PATH"
fi

"${BIN_DIR}/typst" --version
echo "typst_bin_dir=${BIN_DIR}"
