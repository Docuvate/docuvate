# Password reset

[Deutsch](./password-reset.de.md)

## Self-service (web)

1. On the sign-in page, choose **Forgot password?**.
2. Enter your email and **request a link**. The confirmation is neutral (no account enumeration).
3. Open the link from the email, enter the new password twice, save, then sign in.

In the default **Docker Compose** stack the API sends reset emails via SMTP to **Mailpit** (nothing leaves the machine). View emails and links at http://localhost:8025.

## Email (production or your own SMTP)

| Variable                   | Meaning                                                   |
| -------------------------- | --------------------------------------------------------- |
| `SMTP_URL`                 | SMTP URL, for example `smtp://user:pass@mail.example:587` |
| `MAIL_FROM`                | Sender, for example `Docuvate <noreply@example.com>`      |
| `PASSWORD_RESET_MAIL_MODE` | `auto` (default), `smtp` or `log` (non-production only)   |

Compose defaults: `PASSWORD_RESET_MAIL_MODE=smtp`, `SMTP_URL=smtp://mailpit:1025`, `MAIL_FROM=Docuvate <no-reply@docuvate.local>`. Set `SMTP_URL` and `MAIL_FROM` (for example in `.env`) to send real emails.

In production (`NODE_ENV=production`) the `log` mode is disabled; `SMTP_URL` and `MAIL_FROM` are required unless `auto` detects an SMTP configuration.

## Admin CLI (self-hosting)

Sets the password directly (better-auth hashing, credential accounts only):

```bash
pnpm --filter @docuvate/api auth:reset-password user@example.com
```

In the Compose stack:

```bash
docker compose exec -T api pnpm --filter @docuvate/api auth:reset-password user@example.com
```

With a TTY for hidden input:

```bash
docker compose exec api pnpm --filter @docuvate/api auth:reset-password user@example.com
```

Revoke all active sessions:

```bash
pnpm --filter @docuvate/api auth:reset-password user@example.com --revoke-sessions
```

Password via stdin (no TTY):

```bash
printf '%s' 'new-secret-password' | pnpm --filter @docuvate/api auth:reset-password user@example.com
```

Passwords are never logged.
