# Passwort zurücksetzen

## Self-Service (Web)

1. Auf der Anmeldeseite **Passwort vergessen?** wählen.
2. E-Mail eingeben und **Link anfordern**. Die Bestätigung ist neutral (keine Konto-Enumeration).
3. Link aus der E-Mail öffnen, neues Passwort zweimal eingeben, speichern, dann anmelden.

Im Standard-**Docker Compose**-Stack versendet die API Reset-Mails per SMTP an **Mailpit** (kein Versand ins Internet). E-Mails und Links einsehen: http://localhost:8025

## E-Mail (Produktion / eigener SMTP)

| Variable | Bedeutung |
|----------|-----------|
| `SMTP_URL` | SMTP-URL, z. B. `smtp://user:pass@mail.example:587` |
| `MAIL_FROM` | Absender, z. B. `Docuvate <noreply@example.com>` |
| `PASSWORD_RESET_MAIL_MODE` | `auto` (Standard), `smtp` oder `log` (nur Nicht-Produktion) |

Compose-Defaults: `PASSWORD_RESET_MAIL_MODE=smtp`, `SMTP_URL=smtp://mailpit:1025`, `MAIL_FROM=Docuvate <no-reply@docuvate.local>`. Für echten Versand `SMTP_URL` und `MAIL_FROM` setzen (z. B. in `.env`).

In Produktion (`NODE_ENV=production`) ist `log` deaktiviert; `SMTP_URL` und `MAIL_FROM` sind erforderlich, sofern kein SMTP über `auto` erkannt wird.

## Admin-CLI (Self-Hosting)

Setzt das Passwort direkt (better-auth Hashing, nur Credential-Account):

```bash
pnpm --filter @docuvate/api auth:reset-password user@example.com
```

Im Compose-Stack:

```bash
docker compose exec -T api pnpm --filter @docuvate/api auth:reset-password user@example.com
```

Mit TTY für verdeckte Eingabe:

```bash
docker compose exec api pnpm --filter @docuvate/api auth:reset-password user@example.com
```

Alle aktiven Sessions widerrufen:

```bash
pnpm --filter @docuvate/api auth:reset-password user@example.com --revoke-sessions
```

Passwort per stdin (ohne TTY):

```bash
printf '%s' 'new-secret-password' | pnpm --filter @docuvate/api auth:reset-password user@example.com
```

Passwörter werden nicht geloggt.
