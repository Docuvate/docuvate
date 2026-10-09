#!/usr/bin/env bash
# Configure docker.io pull-through mirror on GitHub Actions runners (Hub rate limits).
set -euo pipefail
if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  exit 0
fi
sudo mkdir -p /etc/docker
if [ -f /etc/docker/daemon.json ]; then
  sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.bak
  sudo jq '. + {"registry-mirrors": ["https://mirror.gcr.io"]}' /etc/docker/daemon.json \
    | sudo tee /etc/docker/daemon.json >/dev/null
else
  echo '{"registry-mirrors":["https://mirror.gcr.io"]}' | sudo tee /etc/docker/daemon.json >/dev/null
fi
sudo systemctl restart docker || sudo service docker restart
sleep 3
docker info
