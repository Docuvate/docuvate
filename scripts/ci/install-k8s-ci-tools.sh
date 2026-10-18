#!/usr/bin/env bash
# Install pinned kubectl, kind, kustomize, helm, and kubeconform for CI (no third-party Actions).
set -euo pipefail

KUBECTL_VERSION="${KUBECTL_VERSION:-v1.30.4}"
KIND_VERSION="${KIND_VERSION:-v0.24.0}"
KUSTOMIZE_VERSION="${KUSTOMIZE_VERSION:-v5.4.3}"
HELM_VERSION="${HELM_VERSION:-v3.16.2}"
KUBECONFORM_VERSION="${KUBECONFORM_VERSION:-v0.6.7}"

# Pinned SHA256 checksums (verify every download).
KUBECTL_SHA256="2ffd023712bbc1a9390dbd8c0c15201c165a69d394787ef03eda3eccb4b9ac06"
KIND_SHA256="b89aada5a39d620da3fcd16435b7f28d858927dd53f92cbac77686b0588b600d"
KUSTOMIZE_TAR_SHA256="3669470b454d865c8184d6bce78df05e977c9aea31c30df3c669317d43bcc7a7"
HELM_TAR_SHA256="9318379b847e333460d33d291d4c088156299a26cd93d570a7f5d0c36e50b5bb"
KUBECONFORM_TAR_SHA256="95f14e87aa28c09d5941f11bd024c1d02fdc0303ccaa23f61cef67bc92619d73"

install_dir="${HOME}/.local/bin"
mkdir -p "$install_dir"
export PATH="${install_dir}:${PATH}"

verify_sha() {
  local file="$1" expected="$2"
  local actual
  actual="$(sha256sum "$file" | awk '{print $1}')"
  if [[ "$actual" != "$expected" ]]; then
    echo "SHA256 mismatch for ${file}: expected ${expected}, got ${actual}" >&2
    exit 1
  fi
}

download_binary() {
  local url="$1" sha="$2" dest="$3"
  curl -fsSL "$url" -o "$dest"
  verify_sha "$dest" "$sha"
  chmod +x "$dest"
}

extract_tarball() {
  local url="$1" tar_sha="$2" member="$3" dest="$4"
  local tmp archive
  tmp="$(mktemp -d)"
  archive="${tmp}/archive.tgz"
  curl -fsSL "$url" -o "$archive"
  verify_sha "$archive" "$tar_sha"
  tar -xzf "$archive" -C "$tmp" "$member"
  mv "${tmp}/${member}" "$dest"
  chmod +x "$dest"
  rm -rf "$tmp"
}

download_binary \
  "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl" \
  "$KUBECTL_SHA256" \
  "${install_dir}/kubectl"

download_binary \
  "https://kind.sigs.k8s.io/dl/${KIND_VERSION}/kind-linux-amd64" \
  "$KIND_SHA256" \
  "${install_dir}/kind"

extract_tarball \
  "https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize%2F${KUSTOMIZE_VERSION}/kustomize_${KUSTOMIZE_VERSION}_linux_amd64.tar.gz" \
  "$KUSTOMIZE_TAR_SHA256" \
  "kustomize" \
  "${install_dir}/kustomize"

extract_tarball \
  "https://get.helm.sh/helm-${HELM_VERSION}-linux-amd64.tar.gz" \
  "$HELM_TAR_SHA256" \
  "linux-amd64/helm" \
  "${install_dir}/helm"

extract_tarball \
  "https://github.com/yannh/kubeconform/releases/download/${KUBECONFORM_VERSION}/kubeconform-linux-amd64.tar.gz" \
  "$KUBECONFORM_TAR_SHA256" \
  "kubeconform" \
  "${install_dir}/kubeconform"

kubectl version --client=true | grep -Fq "Client Version: ${KUBECTL_VERSION}"
kind version | grep -Fq "${KIND_VERSION}"
kustomize version | grep -Fq "${KUSTOMIZE_VERSION}"
helm version --short | grep -Fq "${HELM_VERSION}"
kubeconform -v | grep -Fq "${KUBECONFORM_VERSION}"
