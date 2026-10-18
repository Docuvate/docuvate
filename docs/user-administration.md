# User and role administration

[Deutsch](./user-administration.de.md)

See **ADR 019** (roles and administration) and **ADR 011** (frontend save concept).

## Roles

| Role          | Meaning                                             |
| ------------- | --------------------------------------------------- |
| Administrator | User management, invitations, suspend and unsuspend |
| Member        | Regular use, own documents                          |

## First administrator

The **first registered user** automatically becomes an administrator. Further administrators can be appointed by invitation or via the CLI:

```bash
pnpm --filter @docuvate/api auth:promote-admin user@example.com
```

In the Compose stack:

```bash
docker compose exec -T api pnpm --filter @docuvate/api auth:promote-admin user@example.com
```

## Invitations

Administrators invite users under **Settings → Administration → Users**. Docuvate sends an **invitation email** (German or English) with a link to set a password (not "forgot password").

Until the invitation is accepted there is **no** row in `"user"`. The invitation stores email, display name and role in `user_invitations`, and the person appears in the user list with the status **Invited**. **Accepting** creates the account. **Revoking** or **expiry** only affects the invitation.

| Variable                     | Meaning                                                           |
| ---------------------------- | ----------------------------------------------------------------- |
| `SMTP_URL` / `MAIL_FROM`     | Same as password reset ([password-reset.md](./password-reset.md)) |
| `DOCUVATE_INSTALLATION_NAME` | Display name in the invitation (default: Docuvate)                |
| `DOCUVATE_INVITE_TTL_HOURS`  | Link validity in hours (default: 168)                             |
| `WEB_ORIGIN`                 | Base URL for invitation links                                     |

Locally, emails arrive in Mailpit at http://localhost:8025.

## Suspend and unsuspend

Administrators can **suspend** members and other administrators and **unsuspend** them again. Suspended users cannot sign in; the suspension is stored in `installation_user_suspensions`.

## ML feature flags per tenant (0.1.0 beta)

Installation administrators can enable or disable ML features **per tenant**, independently of the installation-wide default in `.env`:

- API: `PATCH /v1/admin/users/{userId}/feature-flags` (OpenAPI at `/v1/openapi.json`)
- Resolved values for the web app: `GET /v1/remote-config` after sign-in

Flags (`exactAnswers`, `answerAbstention`, `smartDuplicates`, `learnedValueTypes`, `layoutKeyValueRoles`, `localChatModel`), the `DOCUVATE_FEATURE_*` environment variables, the **`chat-local`** Compose profile and encoder re-indexing are described in **[ML feature flags](./ml-feature-flags.md)**.

## Demo data for screenshots

```bash
node tools/screenshots/admin/seed-admin-screenshots.mjs
node tools/screenshots/admin/capture-admin-shots.mjs
```
