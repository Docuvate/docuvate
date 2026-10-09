#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
ART="$ROOT/deploy/artifacts"
mkdir -p "$ART"
LOG="$ART/kind-smoke.log"
exec > >(tee "$LOG") 2>&1

REG_HOST="localhost:5001"
# In-cluster pulls use localhost:5001; kind containerd mirrors that to kind-registry:5000 (HTTP).
REG_PULL="localhost:5001"
REG_CONTAINER="kind-registry"
CLUSTER="docuvate-smoke"
REGISTRY_IMAGE="registry:2@sha256:a3d8aaa63ed8681a604f1dea0aa03f100d5895b6a58ace528858a7b332415373"

TAG="${DOCUVATE_SMOKE_TAG:-v0.1.0}"
JOB_SUFFIX="${TAG#v}"
JOB_SUFFIX="${JOB_SUFFIX//./-}"

if [[ "${DV_AGENT_VM:-}" == "1" ]]; then
  bash "$ROOT/scripts/ci/agent-vm-docker-setup.sh"
fi

run_docker() {
  docker "$@"
}
run_kind() {
  kind "$@"
}
if ! docker info >/dev/null 2>&1; then
  if [[ "${DV_AGENT_VM:-}" == "1" ]]; then
    run_docker() { sudo docker "$@"; }
    run_kind() { sudo kind "$@"; }
  else
    echo "Docker is not accessible. Start Docker or set DV_AGENT_VM=1 on an agent VM." >&2
    exit 1
  fi
fi

run_kind version | tee "$ART/kind-version.txt"

start_registry() {
  run_docker rm -f "$REG_CONTAINER" 2>/dev/null || true
  run_docker run -d --restart=always -p "127.0.0.1:5001:5000" --name "$REG_CONTAINER" "$REGISTRY_IMAGE"
}

connect_registry_to_kind() {
  if ! run_docker network connect kind "$REG_CONTAINER" 2>/dev/null; then
    if ! run_docker network inspect kind 2>/dev/null | grep -q "\"${REG_CONTAINER}\""; then
      echo "Failed to attach ${REG_CONTAINER} to docker network kind"
      exit 1
    fi
  fi
}

pull_push() {
  local upstream="$1"
  local repo_tag="$2"
  run_docker pull --platform linux/amd64 "$upstream"
  run_docker tag "$upstream" "${REG_HOST}/${repo_tag}"
  run_docker push "${REG_HOST}/${repo_tag}"
}

flatten_push() {
  local src="$1"
  local repo_tag="$2"
  local df="$ART/flatten-${repo_tag//\//_}.Dockerfile"
  printf 'FROM %s\n' "$src" >"$df"
  export DOCKER_BUILDKIT=1
  export BUILDKIT_NO_PROVENANCE=1
  if run_docker buildx version >/dev/null 2>&1; then
    run_docker buildx build --load --platform linux/amd64 --provenance=false --sbom=false \
      -t "${REG_HOST}/${repo_tag}" -f "$df" "$ART"
  else
    run_docker build --platform linux/amd64 -t "${REG_HOST}/${repo_tag}" -f "$df" "$ART"
  fi
  run_docker push "${REG_HOST}/${repo_tag}"
}

build_app_images() {
  export DOCKER_BUILDKIT=1
  export BUILDX_NO_DEFAULT_ATTESTATIONS=1
  run_docker compose -p docuvate -f docker-compose.yml build api web worker sftp-ingest
  flatten_push docuvate-api "docuvate-api:smoke"
  flatten_push docuvate-web "docuvate-web:smoke"
  flatten_push docuvate-worker "docuvate-worker:smoke"
  flatten_push docuvate-sftp-ingest "docuvate-sftp-ingest:smoke"
}

push_infra_images() {
  pull_push postgres:18.6-alpine@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873 "postgres:18.6-alpine"
  pull_push valkey/valkey:8-alpine@sha256:081c2f5cb575efc901aa80ff9cdbd1ec6a301682fd35e1ebb4b0990a4a4a8507 "valkey:8-alpine"
  pull_push axllent/mailpit:v1.31.4@sha256:b68349e3a014b90c5610bfb26b2ae36f3892d7b8cf25ee140c6c71c98d2fcf48 "mailpit:v1.31.4"

  pull_push cgr.dev/chainguard/minio@sha256:59667194421209c2c1eacbe761e24787e047985c5dfa96b15da9b59fe9b55cd0 "minio:smoke"
}

create_cluster() {
  run_kind delete cluster --name "$CLUSTER" 2>/dev/null || true
  run_kind create cluster --name "$CLUSTER" --config "$ROOT/deploy/scripts/kind-local-registry.yaml" --wait 180s
  KUBECONFIG="${HOME}/.kube/docuvate-kind-smoke.kubeconfig"
  export KUBECONFIG
  mkdir -p "$(dirname "$KUBECONFIG")"
  run_kind export kubeconfig --name "$CLUSTER" --kubeconfig "$KUBECONFIG"
  connect_registry_to_kind
  echo "local-registry+kindnet" >"$ART/cni-mode.txt"
  kubectl wait --for=condition=Ready node --all --timeout=300s
  kubectl -n kube-system wait --for=condition=ready pod -l k8s-app=kube-dns --timeout=180s
  sleep 15
}

rewrite_images_for_registry() {
  sed -e "s|ghcr.io/docuvate/docuvate-api:${TAG}|${REG_PULL}/docuvate-api:smoke|g" \
    -e "s|ghcr.io/docuvate/docuvate-web:${TAG}|${REG_PULL}/docuvate-web:smoke|g" \
    -e "s|ghcr.io/docuvate/docuvate-worker:${TAG}|${REG_PULL}/docuvate-worker:smoke|g" \
    -e "s|ghcr.io/docuvate/docuvate-sftp-ingest:${TAG}|${REG_PULL}/docuvate-sftp-ingest:smoke|g" \
    -e "s|postgres:18.6-alpine@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873|${REG_PULL}/postgres:18.6-alpine|g" \
    -e "s|valkey/valkey:8-alpine@sha256:081c2f5cb575efc901aa80ff9cdbd1ec6a301682fd35e1ebb4b0990a4a4a8507|${REG_PULL}/valkey:8-alpine|g" \
    -e "s|axllent/mailpit:v1.31.4@sha256:b68349e3a014b90c5610bfb26b2ae36f3892d7b8cf25ee140c6c71c98d2fcf48|${REG_PULL}/mailpit:v1.31.4|g" \
    -e "s|cgr.dev/chainguard/minio@sha256:59667194421209c2c1eacbe761e24787e047985c5dfa96b15da9b59fe9b55cd0|${REG_PULL}/minio:smoke|g"
}

wait_core_resources() {
  local i
  for i in $(seq 1 90); do
    kubectl -n docuvate get secret docuvate-secrets >/dev/null 2>&1 &&
      kubectl -n docuvate get statefulset docuvate-postgres >/dev/null 2>&1 && return 0
    sleep 2
  done
  echo "Timed out waiting for secrets and postgres"
  kubectl -n docuvate get events --sort-by=.lastTimestamp | tail -25
  return 1
}

recreate_job_from_manifest() {
  local manifest="$1"
  local name="$2"
  kubectl -n docuvate delete job "$name" --ignore-not-found
  python3 - "$manifest" "$name" <<'PY' | kubectl apply -f -
import sys
import yaml
from pathlib import Path

manifest, name = sys.argv[1], sys.argv[2]
for doc in yaml.safe_load_all(Path(manifest).read_text()):
    if doc and doc.get("kind") == "Job" and doc.get("metadata", {}).get("name") == name:
        yaml.dump(doc, sys.stdout, default_flow_style=False)
        break
PY
}

wait_rollouts() {
  kubectl get ns docuvate -o jsonpath='{.metadata.labels.pod-security\.kubernetes\.io/enforce}{"\n"}' | tee "$ART/psa-label.txt"
  grep -qx restricted "$ART/psa-label.txt"
  kubectl -n docuvate rollout status statefulset/docuvate-postgres --timeout=240s
  recreate_job_from_manifest "$MANIFEST" "docuvate-db-migrate-${JOB_SUFFIX}"
  if ! kubectl -n docuvate wait --for=condition=complete "job/docuvate-db-migrate-${JOB_SUFFIX}" --timeout=420s; then
    dump_job_debug "docuvate-db-migrate-${JOB_SUFFIX}"
    exit 1
  fi
  kubectl -n docuvate logs "job/docuvate-db-migrate-${JOB_SUFFIX}" >"$ART/migrate-${1:-smoke}.log" 2>&1 || true
  kubectl -n docuvate rollout status deployment/docuvate-valkey --timeout=180s
  kubectl -n docuvate rollout status deployment/docuvate-sftp-ingest --timeout=300s
  kubectl -n docuvate rollout status statefulset/docuvate-minio --timeout=300s
  recreate_job_from_manifest "$MANIFEST" "docuvate-minio-init-${JOB_SUFFIX}"
  if ! kubectl -n docuvate wait --for=condition=complete "job/docuvate-minio-init-${JOB_SUFFIX}" --timeout=420s; then
    dump_job_debug "docuvate-minio-init-${JOB_SUFFIX}"
    exit 1
  fi
  if ! kubectl -n docuvate rollout status deployment/docuvate-api --timeout=600s; then
    kubectl -n docuvate logs deployment/docuvate-api --tail=120 >>"$ART/job-debug.txt" 2>&1 || true
    kubectl -n docuvate describe deployment/docuvate-api >>"$ART/job-debug.txt" 2>&1 || true
    exit 1
  fi
  if ! kubectl -n docuvate rollout status deployment/docuvate-worker --timeout=900s; then
    kubectl -n docuvate logs deployment/docuvate-worker --tail=120 >>"$ART/job-debug.txt" 2>&1 || true
    exit 1
  fi
  kubectl -n docuvate rollout status deployment/docuvate-web --timeout=240s
}

assert_web_zero_restarts() {
  local restarts
  restarts="$(kubectl -n docuvate get pods -l app.kubernetes.io/name=docuvate-web \
    -o jsonpath='{.items[0].status.containerStatuses[0].restartCount}')"
  if [[ "${restarts:-}" != "0" ]]; then
    echo "Expected docuvate-web restartCount 0, got ${restarts}"
    kubectl -n docuvate describe pod -l app.kubernetes.io/name=docuvate-web
    exit 1
  fi
}

verify_http() {
  local prefix="$1"
  assert_web_zero_restarts
  kubectl -n docuvate port-forward svc/docuvate-web 8080:80 >/tmp/pf-web.log 2>&1 &
  PF_WEB=$!
  kubectl -n docuvate port-forward svc/docuvate-api 3001:3001 >/tmp/pf-api.log 2>&1 &
  PF_API=$!
  kubectl -n docuvate port-forward svc/docuvate-worker 8000:8000 >/tmp/pf-worker.log 2>&1 &
  PF_WORKER=$!
  sleep 3
  curl -sf http://127.0.0.1:8080/ | tee "$ART/${prefix}-web-index.html" | grep -Eiq 'login|sign.?in|docuvate|html'
  curl -sf http://127.0.0.1:8080/api/health | tee "$ART/${prefix}-web-api-health.json"
  curl -sf http://127.0.0.1:3001/health | tee "$ART/${prefix}-api-health.json"
  curl -sf http://127.0.0.1:3001/v1/openapi.json -o "$ART/${prefix}-openapi.json"
  head -c 400 "$ART/${prefix}-openapi.json" | tee "$ART/${prefix}-openapi-snippet.json" >/dev/null
  curl -sf http://127.0.0.1:8000/v1/health | tee "$ART/${prefix}-worker-health.json"
  kill "$PF_WEB" "$PF_API" "$PF_WORKER" 2>/dev/null || true
}

capture_cluster_proof() {
  local prefix="$1"
  kubectl get pods -A | tee "$ART/${prefix}-kubectl-get-pods.txt"
  kubectl -n docuvate get job | tee "$ART/${prefix}-jobs.txt"
}

cleanup() {
  if [[ "${KIND_SMOKE_KEEP_CLUSTER:-}" == "1" ]]; then
    return 0
  fi
  run_kind delete cluster --name "$CLUSTER" 2>/dev/null || true
  run_docker rm -f "$REG_CONTAINER" 2>/dev/null || true
}
trap cleanup EXIT

dump_job_debug() {
  local job="$1"
  kubectl -n docuvate describe "job/${job}" >>"$ART/job-debug.txt" 2>&1 || true
  kubectl -n docuvate logs "job/${job}" --all-containers=true >>"$ART/job-debug.txt" 2>&1 || true
  kubectl -n docuvate get pods -o wide >>"$ART/job-debug.txt" 2>&1 || true
}

start_registry
build_app_images
push_infra_images
create_cluster

kubectl create namespace docuvate --dry-run=client -o yaml | kubectl apply -f -
kubectl -n docuvate create secret generic docuvate-postgres \
  --from-literal=POSTGRES_USER=docuvate \
  --from-literal=POSTGRES_PASSWORD=docuvate \
  --from-literal=POSTGRES_DB=docuvate \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl -n docuvate create secret generic docuvate-secrets \
  --from-literal=DATABASE_URL=postgresql://docuvate:docuvate@docuvate-postgres:5432/docuvate \
  --from-literal=BETTER_AUTH_SECRET=docuvate-kind-smoke-better-auth-signing-key-32 \
  --from-literal=MINIO_ACCESS_KEY=docuvate \
  --from-literal=MINIO_SECRET_KEY=docuvate-secret \
  --from-literal=WORKER_SECRET=worker-shared-secret \
  --from-literal=DOCUVATE_CONNECTOR_SECRETS_KEY=local-dev-connector-secrets-key!! \
  --from-literal=DOCUVATE_SFTP_INGEST_SERVICE_KEY="${SFTP_INGEST_SERVICE_KEY:-$(openssl rand -base64 32 | tr -d '/+=' | head -c 43)}" \
  --dry-run=client -o yaml | kubectl apply -f -

MANIFEST="$ART/kind-smoke-kustomize.yaml"
kustomize build deploy/kustomize/overlays/dev | rewrite_images_for_registry >"$MANIFEST"
kubectl apply -f "$MANIFEST"
wait_core_resources
wait_rollouts kustomize
capture_cluster_proof kustomize
verify_http kustomize

kubectl delete namespace docuvate --wait=true --timeout=180s

kubectl create namespace docuvate
kubectl -n docuvate create secret generic docuvate-postgres \
  --from-literal=POSTGRES_USER=docuvate \
  --from-literal=POSTGRES_PASSWORD=docuvate \
  --from-literal=POSTGRES_DB=docuvate
kubectl -n docuvate create secret generic docuvate-secrets \
  --from-literal=DATABASE_URL=postgresql://docuvate:docuvate@docuvate-postgres:5432/docuvate \
  --from-literal=BETTER_AUTH_SECRET=docuvate-kind-smoke-better-auth-signing-key-32 \
  --from-literal=MINIO_ACCESS_KEY=docuvate \
  --from-literal=MINIO_SECRET_KEY=docuvate-secret \
  --from-literal=WORKER_SECRET=worker-shared-secret \
  --from-literal=DOCUVATE_CONNECTOR_SECRETS_KEY=local-dev-connector-secrets-key!! \
  --from-literal=DOCUVATE_SFTP_INGEST_SERVICE_KEY="${SFTP_INGEST_SERVICE_KEY:-$(openssl rand -base64 32 | tr -d '/+=' | head -c 43)}"

if ! helm upgrade --install docuvate "$ROOT/deploy/helm/docuvate" \
  -f "$ROOT/deploy/helm/docuvate/values-dev.yaml" \
  --set global.imageRegistry="${REG_PULL}" \
  --set global.imageTag=smoke \
  --set postgres.image="${REG_PULL}/postgres:18.6-alpine" \
  --set minio.image="${REG_PULL}/minio:smoke" \
  --set minio.mcImage="${REG_PULL}/minio:smoke" \
  --set minio.initUseAwsCli=false \
  --set mailpit.image="${REG_PULL}/mailpit:v1.31.4" \
  --namespace docuvate --wait --timeout=20m 2>&1 | tee "$ART/helm-install.log"; then
  kubectl -n docuvate get pods,jobs,events --sort-by=.lastTimestamp | tail -40 >>"$ART/job-debug.txt" 2>&1 || true
  dump_job_debug "docuvate-db-migrate-${JOB_SUFFIX}"
  exit 1
fi

if ! helm upgrade docuvate "$ROOT/deploy/helm/docuvate" \
  -f "$ROOT/deploy/helm/docuvate/values-dev.yaml" \
  --set global.imageRegistry="${REG_PULL}" \
  --set global.imageTag=smoke \
  --set postgres.image="${REG_PULL}/postgres:18.6-alpine" \
  --set minio.image="${REG_PULL}/minio:smoke" \
  --set minio.mcImage="${REG_PULL}/minio:smoke" \
  --set minio.initUseAwsCli=false \
  --set mailpit.image="${REG_PULL}/mailpit:v1.31.4" \
  --namespace docuvate --wait --timeout=20m 2>&1 | tee "$ART/helm-upgrade.log"; then
  kubectl -n docuvate get pods,jobs,events --sort-by=.lastTimestamp | tail -40 >>"$ART/job-debug.txt" 2>&1 || true
  exit 1
fi

helm template docuvate "$ROOT/deploy/helm/docuvate" -f "$ROOT/deploy/helm/docuvate/values-dev.yaml" \
  --set global.imageRegistry="${REG_PULL}" --set global.imageTag=smoke \
  | rewrite_images_for_registry >"$ART/kind-smoke-helm-render.yaml"

if kubectl -n docuvate get job "docuvate-db-migrate-${JOB_SUFFIX}" >/dev/null 2>&1; then
  kubectl -n docuvate wait --for=condition=complete "job/docuvate-db-migrate-${JOB_SUFFIX}" --timeout=300s
  kubectl -n docuvate logs "job/docuvate-db-migrate-${JOB_SUFFIX}" >"$ART/migrate-helm.log" 2>&1 || true
else
  echo "migrate job docuvate-db-migrate-${JOB_SUFFIX} already completed (helm hook-delete-policy)" >"$ART/migrate-helm.log"
fi
kubectl -n docuvate rollout status deployment/docuvate-sftp-ingest --timeout=300s
kubectl -n docuvate rollout status deployment/docuvate-api --timeout=300s
kubectl -n docuvate rollout status deployment/docuvate-web --timeout=240s
kubectl -n docuvate rollout status deployment/docuvate-worker --timeout=300s
capture_cluster_proof helm
verify_http helm

echo "kind-smoke OK: local registry, kustomize + helm, PSA restricted, migrate job, health/openapi"
