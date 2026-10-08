#!/usr/bin/env bash
# Cloud Agent VM: allow Docker container-to-container traffic (compose-smoke).
set -euo pipefail
if command -v iptables-legacy >/dev/null 2>&1; then
  sudo iptables-legacy -P FORWARD ACCEPT
fi
sudo iptables -P FORWARD ACCEPT
