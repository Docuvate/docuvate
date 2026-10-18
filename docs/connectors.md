# Connectors (plugins)

External integrations are modeled as **categories** (mail, DMS, home automation, object storage, …) and **plugins** (Gmail, Outlook, Paperless, Home Assistant, Amazon S3, …). See [ADR 009](./adr/009-connector-plugin-system.md).

## Layers

| Layer | Location |
| --- | --- |
| Domain ports & types | `apps/api/src/modules/connectors/domain/` |
| Live adapters | `apps/api/src/modules/connectors/infrastructure/adapters/` |
| HTTP | `GET /v1/connectors/catalog`, `GET/POST/DELETE /v1/connectors/installations`, import/export actions, OAuth |
| Web UI | `/settings/connectors` |

## Connect flow

1. **Catalog** — categories, plugins, capability roles (`source` / `sink`), auth field schema.
2. **Connect** — `POST /v1/connectors/installations` with credentials; each plugin validates against the remote system (S3 list, Paperless `/api/documents/`, Home Assistant `/api/`, Gmail/Graph profile).
3. **OAuth mail** — `POST /v1/connectors/oauth/{gmail|outlook}/start` → provider → `GET /v1/connectors/oauth/callback` stores tokens encrypted.
4. **Import / export** — `GET …/installations/{id}/importables`, `POST …/import`, `POST …/export` (uses document upload / content ports).

## Environment

| Variable | Purpose |
| --- | --- |
| `DOCUVATE_CONNECTOR_SECRETS_KEY` | AES key for installation credentials |
| `DV_CONNECTOR_ALLOW_PRIVATE_NETWORKS` | When `0`/`false`, Paperless `base_url` must not resolve to private or loopback addresses (metadata ranges are always blocked). Default allows private networks for LAN/compose Paperless instances. |
| `DOCUVATE_API_PUBLIC_URL` | Public API base for OAuth callback derivation |
| `DOCUVATE_CONNECTOR_OAUTH_REDIRECT_URI` | Optional OAuth callback override |
| `DOCUVATE_GMAIL_OAUTH_*` / `DOCUVATE_OUTLOOK_OAUTH_*` | Mail OAuth client credentials |
| `WEB_ORIGIN` | Redirect target after OAuth callback |

Step-by-step provider setup (DE): [connectors-oauth-setup.md](./connectors-oauth-setup.md).

## Verify locally

- **S3 / MinIO:** connect with bucket, keys, `endpoint` + `path_style=true`; connect should succeed only if bucket is listable.
- **Paperless:** instance URL + API token (or username/password); **source-only** bulk import via `/settings/connectors/paperless/{installationId}`. See [ADR 020](./adr/020-paperless-ngx-source-connector.md). Set `DV_CONNECTOR_ALLOW_PRIVATE_NETWORKS` when Paperless runs on a private network.
- **Home Assistant:** base URL + long-lived token; sink-only in catalog.
- **Gmail / Outlook:** requires OAuth env vars; use **Mit Anbieter verbinden** in UI.
