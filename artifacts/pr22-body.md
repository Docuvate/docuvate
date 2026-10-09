# PR #22 — SFTP scanner ingress + SFTP pull connector

Rebased on public main (`d777ad1`).

## Security / ops highlights (round 1 review)

- Compose no longer ships a default `DOCUVATE_SFTP_INGEST_SERVICE_KEY`; the init container generates `service_api_key` on the shared volume. API merges `DOCUVATE_SFTP_INGEST_SERVICE_KEY` / file into service keys without overwriting `DOCUVATE_SERVICE_API_KEYS`.
- Go SFTP: upload byte caps, quota includes `failed/`, blocked client writes into `failed/`, login lockout after handshake, normalized usernames, pull SSRF checks, probe without credentials, `SHA256:` fingerprints, HTTP timeouts.
- Service OpenAPI/SDK surface excludes `/sftp-ingress/service/*`; authenticate is rate-limited.

## CI

Nine jobs: lint-test, db-migrate-fresh, integration-test, docker-build, compose-smoke, kubernetes-manifests, kind-smoke, go-sftp-ingest, sftp-integration.
