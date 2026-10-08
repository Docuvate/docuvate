# ADR 019: Instance roles and administration

**Status:** accepted

## Related ADRs

| ADR | Topic |
|-----|--------|
| **008** | Headless `/v1` and ABAC |
| **011** | Frontend save concept (`PageFormSaveKit`, toasts) |

## Context

Docuvate Core needs installation-level user administration: multiple users, `installation_admin` / `installation_member` roles, invitations, suspend and unsuspend, and per-user TOTP and passkeys. Human identity stays on **better-auth** at `/api/auth/*`; product IAM uses **`/v1`** with OpenAPI. **ABAC** (`AuthorizationPort`) gates document access (ADR 008).

## Decision

### Role and suspension model

| DB role | Customer label (de/en) | Purpose |
|---------|------------------------|---------|
| `installation_admin` | Administrator | User directory and instance administration |
| `installation_member` | Mitglied / Member | Normal use; access to **own** documents |

Roles and suspensions live in Docuvate tables (`installation_user_roles`, `installation_user_suspensions`). better-auth stores identity only (no admin plugin).

### Session → ABAC subject

`AuthorizationSubject.tenantId` is **required** and set to the single implicit installation tenant id (`tenants` row). Service API keys unchanged.

- **`installation_member`:** `roles: ['member']`, `claims: ['document:*']`
- **`installation_admin`:** `roles: ['admin', 'member']`, `claims: ['document:*', 'admin:*']`

Missing `tenantId` denies authorization (fail closed).

### Bootstrap

1. **First registered user** on an empty instance becomes `installation_admin` (transaction + `pg_advisory_xact_lock`).
2. **CLI** `auth:promote-admin <email>` for operator recovery.

Email/password **self-registration** is allowed only until the first user exists unless `DV_ALLOW_SIGNUP=true` (open) or `DV_ALLOW_SIGNUP=false` (closed). After the first user, the default is **invite-only**; additional accounts are created through administrator invitations.

**Last administrator invariant:** cannot demote or suspend the sole remaining active administrator (transactional `SELECT … FOR UPDATE` guard).

### Invitations

Administrators invite by email. Tokens are stored hashed in `user_invitations`, expire (default 7 days, `DOCUVATE_INVITE_TTL_HOURS`), and accept via `POST /v1/invitations/accept` and `/invite?token=` in the web app. Until accept, **no `user` row** exists. Accept is **single-use and transactional**. Invitations **only create new accounts** (no password reset on existing users).

`can(subject, 'installation:invite', …)` enforces the subset rule before insert. Accept re-checks the inviter is still allowed to grant `assigned_role`.

Revoke sets `revoked_at` only (no account deletion).

### Administration UI and API

- Settings: **Account and security** (TOTP, passkeys) plus **Administration** (administrators only).
- Subpage: **Users** (list, invite, role change, suspend/unsuspend, revoke sessions).

### Account security (per user)

TOTP and passkeys via better-auth plugins under **Settings → Account and security**.

### Security boundaries

- Nest `/v1/admin/*` enforces installation IAM and last-administrator rules.
- Invitation mail never logs plaintext tokens (Mailpit in development).

## Consequences

- Impersonation is not supported in Core.
- Headless integrators use the same `/v1/admin/*` and invitation accept endpoints as the UI.
