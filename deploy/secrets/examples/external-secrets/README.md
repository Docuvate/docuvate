# External Secrets Operator

Example `ExternalSecret` syncing from a cluster secret store (adjust `remoteRef` to your provider):

See `docuvate-secrets.external.yaml`.

For Postgres in homelab, add a second `ExternalSecret` for `docuvate-postgres` or embed credentials in `DATABASE_URL` only and use managed Postgres in cloud.
