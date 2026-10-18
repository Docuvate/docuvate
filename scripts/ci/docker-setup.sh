#!/usr/bin/env bash
# Disposable CI/container hosts only: install and start Docker if needed and fix
# Docker bridge east-west traffic (iptables FORWARD DROP).
# Not for workstations or production. Requires explicit opt-in: DOCUVATE_CI_DOCKER_SETUP=1
set -euo pipefail

log() { printf '[docker-setup] %s\n' "$*"; }

if [ "${DOCUVATE_CI_DOCKER_SETUP:-0}" != "1" ]; then
  log "Refusing to run: set DOCUVATE_CI_DOCKER_SETUP=1 (disposable CI/container hosts only). Do not use on workstations."
  exit 1
fi

if [[ "$(id -u)" -ne 0 ]] && command -v sudo >/dev/null 2>&1; then
  SUDO=sudo
elif [[ "$(id -u)" -eq 0 ]]; then
  SUDO=
else
  log "ERROR: run as root or with sudo"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  log "Installing docker.io + compose plugin…"
  $SUDO apt-get update -qq
  $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker.io docker-compose-v2
  docker_user="${SUDO_USER:-${USER:-}}"
  # docker group is root-equivalent on Linux; only acceptable on disposable CI hosts (DOCUVATE_CI_DOCKER_SETUP=1).
  # Never chmod/chown /var/run/docker.sock — add the invoking user to the group instead.
  if [ -n "$docker_user" ] && [ "$docker_user" != "root" ]; then
    if id -nG "$docker_user" 2>/dev/null | tr ' ' '\n' | grep -qx docker; then
      log "User $docker_user already in docker group"
    else
      log "Adding $docker_user to docker group"
      $SUDO usermod -aG docker "$docker_user"
    fi
  fi
fi

if ! $SUDO docker info >/dev/null 2>&1; then
  log "Starting dockerd…"
  if command -v systemctl >/dev/null 2>&1; then
    $SUDO systemctl start docker 2>/dev/null || true
  fi
  if ! $SUDO docker info >/dev/null 2>&1; then
    $SUDO dockerd >/var/log/dockerd-ci.log 2>&1 &
    for _ in $(seq 1 30); do
      $SUDO docker info >/dev/null 2>&1 && break
      sleep 1
    done
  fi
fi

if ! $SUDO docker info >/dev/null 2>&1; then
  log "ERROR: docker daemon not reachable"
  exit 1
fi

if command -v iptables-legacy >/dev/null 2>&1; then
  before=$($SUDO iptables-legacy -S FORWARD 2>/dev/null | head -1 || true)
  if [[ "$before" == *DROP* ]]; then
    log "Detected iptables-legacy FORWARD DROP — fixing"
  fi
  $SUDO iptables-legacy -P FORWARD ACCEPT
fi

if command -v iptables >/dev/null 2>&1; then
  before=$($SUDO iptables -S FORWARD 2>/dev/null | head -1 || true)
  if [[ "$before" == *DROP* ]]; then
    log "Detected iptables (nft) FORWARD DROP — fixing"
  fi
  $SUDO iptables -P FORWARD ACCEPT
fi

NET=docuvate-docker-verify-$$
cleanup() {
  $SUDO docker rm -f "${NET}-a" "${NET}-b" >/dev/null 2>&1 || true
  $SUDO docker network rm "$NET" >/dev/null 2>&1 || true
}
trap cleanup EXIT

$SUDO docker network create "$NET" >/dev/null
$SUDO docker run -d --name "${NET}-a" --network "$NET" busybox:1.36 sleep 120 >/dev/null
$SUDO docker run -d --name "${NET}-b" --network "$NET" busybox:1.36 sleep 120 >/dev/null
IP_A=$($SUDO docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "${NET}-a")
if ! $SUDO docker exec "${NET}-b" ping -c 2 -W 2 "$IP_A" >/dev/null 2>&1; then
  log "ERROR: inter-container ping failed after FORWARD ACCEPT"
  exit 1
fi

log "OK: FORWARD ACCEPT applied; inter-container traffic verified"
