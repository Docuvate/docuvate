# Nutzer- und Rollenverwaltung

Siehe **ADR 019** (Rollen und Administration) und **ADR 011** (Speicherkonzept Frontend).

## Rollen

| Rolle | Bedeutung |
|-------|-----------|
| Administrator | Nutzerverwaltung, Einladungen, Sperren und Entsperren |
| Mitglied | Normale Nutzung, eigene Dokumente |

## Erster Administrator

Der **erste registrierte Nutzer** wird automatisch Administrator. Weitere Administratoren können per Einladung oder CLI ernannt werden:

```bash
pnpm --filter @docuvate/api auth:promote-admin user@example.com
```

Im Compose-Stack:

```bash
docker compose exec -T api pnpm --filter @docuvate/api auth:promote-admin user@example.com
```

## Einladungen

Administratoren laden Nutzer unter **Einstellungen → Administration → Nutzer** ein. Es wird eine **Einladungs-E-Mail** (de/en) mit Link zum Passwort festlegen versendet (nicht „Passwort vergessen“).

Bis zur Annahme gibt es **keine** Zeile in `"user"`. Die Einladung speichert E-Mail, Anzeigename und Rolle in `user_invitations`. Die Person erscheint in der Nutzerliste mit Status **Eingeladen**. **Annahme** legt das Konto an. **Widerruf** oder **Ablauf** betrifft nur die Einladung.

| Variable | Bedeutung |
|----------|-----------|
| `SMTP_URL` / `MAIL_FROM` | Wie Passwort-Reset ([password-reset.md](./password-reset.md)) |
| `DOCUVATE_INSTALLATION_NAME` | Anzeigename in der Einladung (Standard: Docuvate) |
| `DOCUVATE_INVITE_TTL_HOURS` | Gültigkeit des Links (Standard: 168) |
| `WEB_ORIGIN` | Basis-URL für Einladungslinks |

Lokal: Mailpit http://localhost:8025

## Sperren und Entsperren

Administratoren können Mitglieder und andere Administratoren **sperren** (Suspend) und wieder **entsperren**. Gesperrte Nutzer können sich nicht anmelden; die Sperre liegt in `installation_user_suspensions`.

## Demo-Daten für Screenshots

```bash
node tools/screenshots/admin/seed-admin-screenshots.mjs
node tools/screenshots/admin/capture-admin-shots.mjs
```
