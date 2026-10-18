# Connector ports and Home Assistant (stub)

See [ADR 009](./adr/009-connector-plugin-system.md) for categories, auth strategies, and lifecycle.

## Capability roles (source / sink)

| Role | Meaning in Docuvate |
| --- | --- |
| **source** | Pull or subscribe to external data (mail, DMS documents, HA events/state/media). |
| **sink** | Push actions or payloads outward (archive to DMS, HA `notify.*`, `call_service`). |

Plugins declare one or both roles in `capabilities[]`. Sync jobs (future) will require a matching role on the installation’s plugin.

## Category ports (future adapters)

Document and automation use cases depend on **category ports**, not concrete plugins:

| Category | Port | Planned shared operations |
| --- | --- | --- |
| `mail` | `MailConnectorCategoryPort` | List mailboxes, fetch messages/attachments |
| `dms` | `DmsConnectorCategoryPort` | Search/import/export documents |
| `home_automation` | `HomeAutomationConnectorCategoryPort` | Subscribe to events; invoke services |

OSS stubs today only expose catalog metadata and credential shape validation.

## Home Assistant plugin (`home_assistant`)

**Category:** `home_automation`

**Auth:** instance URL + long-lived access token (HA profile → security → long-lived access tokens). Strategy `custom` with `base_url` and `access_token` fields.

**Roles:**

| Role | Intended use (later) |
| --- | --- |
| **sink** | `notify.*` when extraction completes, or arbitrary `call_service` from user-defined automations/rules. |

Home Assistant is **sink-only** in the catalog (no ingestion/source role).

No outbound HTTP to HA in CI or MVP connect flow — `validateConfiguration` only checks required fields.

**Registration:** `HomeAssistantHomeAutomationConnector` in `apps/api/src/modules/connectors/infrastructure/stubs/`.
