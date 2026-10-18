#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ver="$(awk '/^golang /{print $2; exit}' "$ROOT/.tool-versions")"
if [[ -z "$ver" ]]; then
  echo "install-go-toolchain: missing golang in .tool-versions" >&2
  exit 1
fi
if command -v go >/dev/null 2>&1 && go version | grep -q "go${ver} "; then
  go version
  exit 0
fi
curl -fsSL "https://go.dev/dl/go${ver}.linux-amd64.tar.gz" | sudo tar -C /usr/local -xzf -
echo "/usr/local/go/bin" >> "${GITHUB_PATH:-/dev/null}"
export PATH="/usr/local/go/bin:$PATH"
go version
