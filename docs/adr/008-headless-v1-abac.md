# ADR 008: Headless `/v1` product API and ABAC

**Status:** accepted

## Context

Docuvate is used as a document data-room backbone by other products, not only the first-party web UI. Integrators need a stable, versioned HTTP API with machine authentication and attribute-based access control (ABAC), without coupling to React routes or session cookies alone.

## Decision

### Headless mode

- NestJS exposes the **product API under `/v1`** (documents, taxonomy, folders, mappen, settings). Routes are UI-agnostic DTOs from `@docuvate/contracts`.
- **Health** stays unversioned at `/health` and `/health/ready` for probes.
- **Human auth** remains **better-auth** at `/api/auth/*` (email/password in Community MVP). Additional human identity flows can plug in via `IdentityProviderPort` when provided by an extension module.
- **Service-to-service auth** is supported on `/v1` via:
  - **API keys** — `Authorization: Bearer <key>` or `X-Docuvate-Api-Key: <key>`, configured with `DOCUVATE_SERVICE_API_KEYS` (JSON).
  - **Bearer token verification** — reserved behind `ServiceTokenVerifierPort`; not wired in MVP (deny until configured).

Integrators call `https://<host>/v1/...` with either a better-auth session cookie (same as the web app) or a service API key acting in a configured tenant (user scope).

### Authorization (ABAC)

- Application code depends on **`AuthorizationPort`** (domain), not Nest guards, for policy decisions.
- **Deny by default.** Policies evaluate **subject** attributes (kind, tenant, roles, claims) against **resource** attributes (owner, status, tag ids, folder/mappe) and **action** (`document:read`, `document:list`, `document:content:read`, `document:chat`, …).
- MVP engine is an in-process **`AbacAuthorizationAdapter`**: owner users allow-all on their tenant; service principals require explicit claims; cross-tenant always denied. Label/folder/status rules are extensible incrementally.
- Enforced first on **document list, get, content, and chat** use cases; other endpoints still rely on repository user scoping until policies expand.

### OpenAPI

- Canonical spec: `openapi/docuvate.v1.json` (generated from NestJS Swagger; paths under `/v1`).
- Served at **`GET /v1/openapi.json`** (runtime-generated, same source as export).
- Paths may carry `x-docuvate-tier: oss | commercial` where features differ by edition.

## Consequences

- The web app uses `/v1` for REST calls; auth base URL unchanged.
- Breaking change for any client that assumed unprefixed `/documents` — only `/v1/documents` is supported going forward.
- Full policy DSL, admin UI, and service token verification can land incrementally behind the same ports.
