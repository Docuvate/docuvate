# Homelab secrets (not committed)

Create these Secrets in namespace `docuvate` before sync:

- `docuvate-postgres`: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `docuvate-secrets`: see `deploy/secrets/examples/docuvate-secrets.env.example`

Use SOPS (`deploy/secrets/examples/sops/`) or External Secrets (`deploy/secrets/examples/external-secrets/`) in production GitOps.
