# ADR 009: Connector / plugin system

**Status:** accepted (MVP skeleton)

## Context

Docuvate must integrate external systems (e-mail, DMS such as Paperless, later CRM/ERP) without baking provider logic into document use cases. Integrations should work self-hosted, support open-core vs commercial extensions, and expose a connector-style auth wizard (host URL, OAuth, tokens, app passwords) per plugin.

## Decision

### Categories vs plugin instances

| Concept | Meaning |
| --- | --- |
| **Connector category** | Stable product grouping (`mail`, `dms`, `home_automation`, …) with optional **category ports** (e.g. shared mail operations) that document/sync use cases depend on — never on a concrete provider. |
| **Connector plugin** | A registered **implementation** within one category (`gmail`, `outlook`, `paperless`, `home_assistant`, …): metadata, capability roles, auth schema, and (later) runtime adapters. |
| **Connector installation** | A **user-scoped instance** of a plugin: display name, enabled flag, and **encrypted credentials** bound to `user_id` + `plugin_id`. |

Categories are listed in core; plugins are registered at API bootstrap (OSS stubs today; commercial modules register additional plugins via the same registry port).

### Ports and capability roles

Domain interfaces live under `apps/api/src/modules/connectors/domain/`:

- **`ConnectorCategoryDescriptor`** — catalog metadata (`id`, i18n keys).
- **`ConnectorPlugin`** — one provider: `descriptor`, `authDescriptor()`, stub `validateConfiguration()`.
- **`ConnectorRegistryPort`** — list categories/plugins; resolve plugin by id (in-process registry for MVP).
- **Role tags** — `ConnectorCapabilityRole`: `'source' | 'sink'`. A plugin with both is **bidirectional** without a third enum; sync jobs require the matching role.
- **`MailConnectorCategoryPort` / `DmsConnectorCategoryPort` / `HomeAutomationConnectorCategoryPort`** — marker ports for future shared operations (list mailboxes, push document, HA notify/service calls, …). Document use cases will depend on these ports, not on Gmail/Paperless/Home Assistant types.

No category-specific logic in documents, labels, or pipeline modules in this phase.

### Auth

- **`ConnectorAuthDescriptor`**: `strategy` + `fields[]`.
- **Strategies:** `oauth2`, `bearer`, `basic`, `api_key`, `custom` (plugin-defined field set).
- **`ConnectorAuthFieldDescriptor`**: `key`, `labelKey`, `type` (`text` | `password` | `url` | `email`), `required`, `secret`, optional help/placeholder i18n keys.
- Auth UX is **per plugin**; core only renders the schema and posts opaque key/value maps to the API.
- **Secrets:** never logged; never returned from read APIs; validated only inside the plugin adapter (stubs accept non-empty required fields).

### Lifecycle and credential storage

1. **Discover** — `GET /v1/connectors/catalog` (categories, plugins, auth descriptors, tier); `GET /v1/connectors/plugins/{pluginId}` for a single plugin schema.
2. **Connect** — `POST /v1/connectors/installations` with `pluginId`, `displayName`, `credentials` map → encrypt → persist.
3. **List** — `GET /v1/connectors/installations` (metadata only).
4. **Enable/disable / delete** — deferred; schema allows `enabled` for later PATCH.

Credentials are stored in **`connector_installations.credentials_encrypted`** (BYTEA), encrypted at the application layer with AES-256-GCM keyed by **`DOCUVATE_CONNECTOR_SECRETS_KEY`** (required in production; dev fallback documented in code). This is separate from **`user_preferences`** (UI prefs) and **`account`** (better-auth OAuth for human login).

### Web Settings UI

- Route **`/settings/connectors`** (EN path; DE copy via i18n).
- Flow: categories → plugins → **Verbinden** opens a form generated from `ConnectorAuthDescriptor`.
- Submit calls installation API (MVP: stub validation only, no sync jobs).

### Open-core vs commercial

- Each plugin descriptor includes **`tier`**: `oss` | `commercial`.
- Registry bootstrap in OSS registers OSS stubs; commercial Nest modules call `ConnectorRegistry.register()` for extra plugins.
- OpenAPI paths may carry `x-docuvate-tier` where applicable (same pattern as ADR 008).

## Consequences

- Real Gmail/Outlook OAuth and Paperless REST clients are **follow-up** work behind `ConnectorPlugin` implementations.
- Sync/pull use cases will take `ConnectorInstallationId` and resolve plugins through the registry + category ports.
- Rotating `DOCUVATE_CONNECTOR_SECRETS_KEY` requires a re-encryption migration (not in MVP).

## References

- Overview: `docs/connectors.md`
- Home Assistant roles: `docs/connectors-ports-and-home-assistant.md`
- ABAC / `/v1`: ADR 008
