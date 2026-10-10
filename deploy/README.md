# Docuvate deployment

| Path | Purpose |
|------|---------|
| `kustomize/base` | Core workloads (API, Web, Worker, migrate Job, Ingress, HPA, PDB, NetworkPolicy) |
| `kustomize/overlays/{homelab,cloud,dev}` | Environment-specific composition |
| `kustomize/components/*` | Optional MinIO, Ollama, Mailpit, GPU worker, Postgres, Valkey |
| `apps/worker/DOCKER-IMAGES.md` | CPU vs GPU worker images (Compose override, Helm `gpuWorker.enabled`) |
| `helm/docuvate` | Equivalent Helm chart |
| `gitops/examples` | Argo CD and Flux samples |
| `secrets/examples` | SOPS and External Secrets patterns |
| `scripts/kind-smoke.sh` | Local/CI smoke on kind |

Primary packaging: **Kustomize** (see ADR 014).
