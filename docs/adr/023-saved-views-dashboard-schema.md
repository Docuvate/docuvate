# 023 — Saved views and dashboard persistence

## Status

Accepted

## Context

Users need named document list states and a configurable start dashboard. Label filters must remain queryable in 3NF. Group-based sharing may be added later without breaking the view model.

## Decision

1. **`saved_document_views`** stores relational filter fields (status, inbox flags, folder/mappe/correspondent FKs, document date range, sort, scope, view/filter mode). **`search_query`** holds only free-text search, not label tokens. **`visible_columns`** is JSONB (ADR 015 allowlist): ordered presentation column ids, never filtered in SQL.
2. **`saved_document_view_tags`** is the sole store for label IDs; nothing duplicates tag IDs inside `search_query`. Writes validate tag/folder/mappe/correspondent ownership; shared views cannot include owner-scoped filters.
3. **`dashboard_widgets`** and **`installation_dashboard_widgets`** store widget rows with **`saved_view_id`** (FK to `saved_document_views`, `ON DELETE CASCADE` when `widget_type = saved_view`) and optional **`item_limit`** (`smallint`). No JSONB config column.
4. **Installation admin** actions (shared visibility, installation default dashboard) use **`installation_user_roles`** (`installation_admin`) via `InstallationRoleReader` (ADR 019). No `user.role` on better-auth.
5. Future group shares can add a grant table without changing view rows.

## Consequences

- API composes library list queries from relational view fields plus `search_query`.
- Web calls `GET /dashboard/installation-admin` for admin UI gating until session carries installation roles from ADR 019.
- New installs seed installation widget rows, not a JSON settings blob.
