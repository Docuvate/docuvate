# Cloud secrets (managed services)

Provide `docuvate-secrets` via your secret manager. Required keys:

- `DATABASE_URL` (managed Postgres, TLS)
- `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` (S3 compatible API; set `MINIO_ENDPOINT` in the ConfigMap patch)
- `BETTER_AUTH_SECRET`
- `WORKER_SECRET`

Optional:

- `DOCUVATE_CONNECTOR_SECRETS_KEY` (connector credential encryption)

Public URLs (`DOCUVATE_PUBLIC_WEB_URL`, `DOCUVATE_PUBLIC_API_URL`) live in the ConfigMap patch, not in the Secret.

Optional GPU worker: enable Helm `gpuWorker.enabled` or Kustomize component `../../components/gpu-worker`.
