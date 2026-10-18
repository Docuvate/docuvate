# Database migrations on upgrade

The API can run migrations on startup when `DOCUVATE_RUN_MIGRATIONS_ON_START` is not `false` (Docker Compose default). Kubernetes sets it to `false` on API pods; apply schema changes with the migrate Job instead.

## Job naming

Job names include the app version suffix, for example `docuvate-db-migrate-0-1-0` for tag `v0.1.0`. Bump the suffix with:

```bash
bash deploy/scripts/bump-version.sh vX.Y.Z
```

That updates Kustomize Job names, Helm hook Job names, and `Chart.yaml` `appVersion`.

## Argo CD sync order

Apply infrastructure (Postgres, MinIO, Valkey, Ollama) before application Deployments. Example Flux/Argo ordering is in `deploy/gitops/examples/`. Migrate and init Jobs should complete before API and worker rollouts.

## Helm

The chart renders `docuvate-db-migrate-<version-suffix>` with `helm.sh/hook: post-install,pre-upgrade` and `hook-delete-policy: before-hook-creation,hook-succeeded`. Postgres is a normal release resource (not a hook). A wait-postgres init container runs when `postgres.enabled` is true.

## MinIO bucket init

Job `docuvate-minio-init-<version-suffix>` runs after the MinIO StatefulSet is ready when MinIO is enabled in the overlay or values file.
