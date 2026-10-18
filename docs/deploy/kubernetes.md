# Kubernetes deployment

## Prerequisites

You need Kubernetes 1.28 or newer, kubectl, Kustomize or Helm, and an Ingress controller. Homelab installs on k3s often use Traefik (`ingressClassName: traefik` in the homelab overlay). Application images are `ghcr.io/docuvate/docuvate-{api,web,worker}` with a Git tag (for example `v0.1.0` or `sha-<short>`). Run `bash deploy/scripts/bump-version.sh vX.Y.Z` before each release to sync the migrate Job suffix and Chart `appVersion`.

## Layout

| Path | Purpose |
| ---- | ------- |
| `deploy/kustomize/base` | Core workloads, Ingress, HPA, PDB, NetworkPolicy |
| `deploy/kustomize/overlays/{dev,homelab,cloud}` | Environment composition |
| `deploy/helm/docuvate` | Equivalent chart (`values.yaml`, `values-dev.yaml`, `values-homelab.yaml`, `values-cloud.yaml`) |
| `deploy/gitops/examples` | Argo CD and Flux samples |
| `deploy/secrets/examples` | SOPS and External Secrets patterns |

Kustomize is the primary GitOps path; see [ADR 014](../adr/014-kubernetes-kustomize-primary.md).

## Migrations

API pods set `DOCUVATE_RUN_MIGRATIONS_ON_START=false`. Schema changes run in Job `docuvate-db-migrate-<version-suffix>` (Kustomize) or a Helm hook Job with the same suffix. Helm uses `post-install,pre-upgrade` hooks; the wait-postgres init container orders in-cluster Postgres before migrate. See `deploy/gitops/examples/MIGRATIONS.md`.

## Homelab overlay

1. Create secrets per `deploy/kustomize/overlays/homelab/secrets/README.md`.
2. Run `bash deploy/scripts/bump-version.sh vX.Y.Z`.
3. Apply PSA `restricted` via `deploy/kustomize/base/namespace.yaml`. If your GitOps tool creates the namespace, create it out of band with the same labels (no Helm `namespace.yaml` in the chart to avoid ownership conflicts).
4. `kubectl apply -k deploy/kustomize/overlays/homelab`.

Includes in-cluster Postgres 18, Valkey, and MinIO (Chainguard image, same digest as Compose). Mailpit is only in the `dev` overlay for local SMTP. Set `SMTP_URL` in the homelab ConfigMap patch; NetworkPolicy allows outbound SMTP (port 587) and HTTPS for the API. Source connectors that call external hosts need similar egress rules.

Optional: add component `components/ollama` for document chat, or Helm `ollama.enabled`.

## Cloud overlay

External managed Postgres and S3-compatible storage, `MINIO_USE_SSL=true`, optional `MINIO_REGION`, Valkey in the cluster, higher worker resources. No in-cluster Postgres or MinIO. Placeholders use `REPLACE_WITH_*` hostnames only.

Ingress defaults to Traefik on k3s: `ingressClassName: traefik` and web ingress from the `kube-system` namespace. If you use ingress-nginx instead, change **both** the Ingress class and `networkPolicies.ingressNamespace` in `values-cloud.yaml` or the cloud Kustomize patches.

Migrate Jobs receive egress to ports 443 and 5432 for managed databases (Kustomize `networkpolicy-migrate-external-egress.yaml` and Helm when `postgres.enabled` is false).

## External S3

The API reads `MINIO_USE_SSL` and optional `MINIO_REGION` from the ConfigMap. Port 443 implies TLS to the object store endpoint.

## Worker models

The worker image caches Paddle and fastembed under `/opt/models` (UID 65534). Optional GPU workloads use image `ghcr.io/docuvate/docuvate-worker-gpu` via Kustomize component `gpu-worker` or Helm `gpuWorker.enabled`. CI does not publish the GPU image; build and push it yourself if needed.

## Validation and smoke

Manifest validation (local or CI job `kubernetes-manifests`):

```bash
bash tools/k8s-manifest-validate.sh
```

This runs Kustomize build, Helm lint/template, kubeconform `-strict` (Kubernetes 1.30), image tag consistency, and the Kustomize/Helm parity report.

Optional end-to-end smoke on [kind](https://kind.sigs.k8s.io/) (pinned node image, local registry, dev overlay, Helm dev values, migrate Jobs, health and OpenAPI checks, web proxy to API health):

```bash
bash tools/k8s-kind-smoke.sh
```

## PostgreSQL 18 backup and restore

Pin `postgres:18.6-alpine` (digest in `deploy/versions.env`). Mount data at `/var/lib/postgresql`, not `/var/lib/postgresql/data`.

Logical backup:

```bash
kubectl -n docuvate port-forward svc/docuvate-postgres 5433:5432
export PGPASSWORD='…'
pg_dump -Fc -h 127.0.0.1 -p 5433 -U docuvate docuvate > docuvate-$(date +%Y%m%d).dump
```

Restore into an empty PG 18 database:

```bash
pg_restore --exit-on-error -h 127.0.0.1 -p 5433 -U docuvate -d docuvate docuvate-YYYYMMDD.dump
```

Run the migrate Job if the schema revision lags the app. Respect db-storage-guard rules: empty database plus non-empty MinIO `documents` bucket must not start silently (see `docs/self-hosting.md`).

For StackGres, declare extensions `pgcrypto` and optional `pg_trgm` in `SGCluster.spec.postgres.extensions`; see `deploy/gitops/examples/stackgres-sgcluster.yaml`.
