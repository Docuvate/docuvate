# IAM / admin schema (3NF)

Owner rule: schema at least **3NF** (no repeating groups, no transitive dependencies, no duplicated derivable facts; JSONB only for opaque payloads that are never filtered or indexed).

## Installation roles and suspension

| Fact | Storage |
|------|---------|
| Instance role | `installation_user_roles` (one row per user; see ADR 019) |
| Suspension | `installation_user_suspensions` (`reason`, `suspended_at`, optional `expires_at`) |

**3NF:** Compliant. Roles and suspension are not duplicated on the better-auth `user` row.

## `user` (better-auth)

Identity and profile fields only. Optional `twoFactorEnabled` flag when MFA migration is applied.

## `session`

Standard better-auth session rows. Docuvate blocks `/api/auth/admin/*` and does not use impersonation.

**3NF:** Compliant.

## `user_invitations`

| Fact | Storage |
|------|---------|
| Pending invite | `invitee_email`, `invitee_name`, `assigned_role`, `token_hash`, `expires_at` |
| Lifecycle | `accepted_at`, `revoked_at`, `created_at` |
| Inviter | `invited_by_user_id` |

**3NF:** Compliant. No duplicate email/name on the invitation row after accept (account is created via accept flow).

## MFA (per user)

| Fact | Storage |
|------|---------|
| TOTP enrollment | `twoFactor` table |
| Passkeys | `passkey` table with unique `credentialID` |

## Not in Community Edition

| Area | Status |
|------|--------|
| Permissions matrix | ABAC in code (ADR 008) |
| Custom roles / orgs | Not persisted |

When those land, apply the same 3NF checklist before merge.
