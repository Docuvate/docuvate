# Dev overlay secrets

Create these Secrets in namespace `docuvate` before applying the dev overlay (no inline secrets in Git):

```bash
kubectl create namespace docuvate --dry-run=client -o yaml | kubectl apply -f -
kubectl -n docuvate create secret generic docuvate-postgres \
  --from-literal=POSTGRES_USER=docuvate \
  --from-literal=POSTGRES_PASSWORD=docuvate \
  --from-literal=POSTGRES_DB=docuvate
kubectl -n docuvate create secret generic docuvate-secrets \
  --from-literal=DATABASE_URL=postgresql://docuvate:docuvate@docuvate-postgres:5432/docuvate \
  --from-literal=BETTER_AUTH_SECRET=local-dev-secret-change-me-32chars!! \
  --from-literal=MINIO_ACCESS_KEY=docuvate \
  --from-literal=MINIO_SECRET_KEY=docuvate-secret \
  --from-literal=WORKER_SECRET=worker-shared-secret \
  --from-literal=DOCUVATE_CONNECTOR_SECRETS_KEY=local-dev-connector-secrets-key!!
```

See also `deploy/secrets/examples/` for External Secrets and SOPS patterns.
