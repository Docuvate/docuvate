# Dev overlay secrets

Create these Secrets in namespace `docuvate` before applying the dev overlay (no inline secrets in Git).

Generate a signing secret (do not use documented placeholders; the API rejects them in production):

```bash
BETTER_AUTH_SECRET="$(openssl rand -hex 32)"
SFTP_INGEST_SERVICE_KEY="$(openssl rand -base64 32 | tr -d '/+=' | head -c 43)"
kubectl create namespace docuvate --dry-run=client -o yaml | kubectl apply -f -
kubectl -n docuvate create secret generic docuvate-postgres \
  --from-literal=POSTGRES_USER=docuvate \
  --from-literal=POSTGRES_PASSWORD=docuvate \
  --from-literal=POSTGRES_DB=docuvate
kubectl -n docuvate create secret generic docuvate-secrets \
  --from-literal=DATABASE_URL=postgresql://docuvate:docuvate@docuvate-postgres:5432/docuvate \
  --from-literal=BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET}" \
  --from-literal=MINIO_ACCESS_KEY=docuvate \
  --from-literal=MINIO_SECRET_KEY=docuvate-secret \
  --from-literal=WORKER_SECRET=worker-shared-secret \
  --from-literal=DOCUVATE_CONNECTOR_SECRETS_KEY="$(openssl rand -hex 16)" \
  --from-literal=DOCUVATE_SFTP_INGEST_SERVICE_KEY="${SFTP_INGEST_SERVICE_KEY}" \
  --from-literal=DOCUVATE_SERVICE_API_KEYS="[{\"keyId\":\"sftp-ingest\",\"secret\":\"${SFTP_INGEST_SERVICE_KEY}\",\"tenantUserId\":\"local-dev-owner\",\"roles\":[\"integrator\"],\"claims\":[\"sftp_ingress:service\"]}]"
```

See also `deploy/secrets/examples/` for External Secrets and SOPS patterns. Replace every `REPLACE` placeholder in those examples before applying.
