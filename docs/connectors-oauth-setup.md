# Gmail- und Outlook-OAuth einrichten

Diese Anleitung beschreibt, wie Sie OAuth-Client-Zugangsdaten für die Mail-Connectors **Google Mail** und **Microsoft Outlook** in Docuvate hinterlegen. Ohne diese Variablen bleibt „Verbinden“ in der UI deaktiviert.

## Übersicht

| Anbieter | OAuth-Autorisierung | Token-Austausch | Scopes (exakt aus dem Code) |
| --- | --- | --- | --- |
| Google | `https://accounts.google.com/o/oauth2/v2/auth` | `https://oauth2.googleapis.com/token` | `https://www.googleapis.com/auth/gmail.readonly` |
| Microsoft | `https://login.microsoftonline.com/common/oauth2/v2.0/authorize` | `https://login.microsoftonline.com/common/oauth2/v2.0/token` | `offline_access`, `Mail.Read` |

Zusätzliche Authorize-Parameter (Google): `access_type=offline`, `prompt=consent` (Refresh-Token).

Der Flow nutzt **PKCE (S256)**, signiertes **state** (15 Minuten Gültigkeit) und speichert Tokens **verschlüsselt** (`DOCUVATE_CONNECTOR_SECRETS_KEY`).

## Redirect-URIs (exakt in der Anbieter-Konsole eintragen)

Der Callback wird von der **API** verarbeitet (`GET /v1/connectors/oauth/callback`), nicht vom Vite-Dev-Server allein.

| Umgebung | Redirect-URI |
| --- | --- |
| Lokale Entwicklung (API auf Port 3001) | `http://localhost:3001/v1/connectors/oauth/callback` |
| Docker Compose (API published auf 3001) | `http://localhost:3001/v1/connectors/oauth/callback` |
| Produktion hinter nginx (`/api` → API) | `https://IHR-HOSTNAME/api/v1/connectors/oauth/callback` |

Optional können Sie die URI fest setzen:

```bash
DOCUVATE_CONNECTOR_OAUTH_REDIRECT_URI=https://IHR-HOSTNAME/api/v1/connectors/oauth/callback
```

Alternativ Basis-URL der öffentlichen API (ohne `/v1`):

```bash
DOCUVATE_API_PUBLIC_URL=https://IHR-HOSTNAME/api
# → Callback wird zu …/v1/connectors/oauth/callback
```

Nach erfolgreichem OAuth leitet die API zurück zu `WEB_ORIGIN` (Standard: `http://localhost:5173`) → `/settings/connectors?oauth=success`.

## Umgebungsvariablen

| Variable | Beschreibung |
| --- | --- |
| `DOCUVATE_GMAIL_OAUTH_CLIENT_ID` | Google OAuth Client-ID (Web-Client) |
| `DOCUVATE_GMAIL_OAUTH_CLIENT_SECRET` | Google Client-Secret |
| `DOCUVATE_OUTLOOK_OAUTH_CLIENT_ID` | Microsoft Application (client) ID |
| `DOCUVATE_OUTLOOK_OAUTH_CLIENT_SECRET` | Microsoft Client Secret |
| `DOCUVATE_CONNECTOR_SECRETS_KEY` | AES-Schlüssel für verschlüsselte Connector-Zugangsdaten (mind. 32 Zeichen empfohlen) |
| `DOCUVATE_CONNECTOR_OAUTH_REDIRECT_URI` | Optional: exakte Callback-URL |
| `DOCUVATE_API_PUBLIC_URL` | Optional: öffentliche API-Basis-URL für Callback-Ableitung |
| `WEB_ORIGIN` | Ziel nach OAuth (Web-App-Origin) |

In **docker-compose.yml** werden die Gmail-/Outlook-Variablen an den `api`-Service durchgereicht (`${VAR:-}`). Werte in `.env` im Repo-Root setzen oder exportieren.

## Google Cloud Console

1. **Projekt** anlegen oder auswählen.
2. **Gmail API** aktivieren (APIs & Dienste → Bibliothek → „Gmail API“).
3. **OAuth-Zustimmungsbildschirm** konfigurieren (Extern oder Intern).
   - Testphase: **Testnutzer** hinzufügen (nur diese Konten können sich anmelden, bis die App verifiziert ist).
   - Scope: `https://www.googleapis.com/auth/gmail.readonly` ist ein **eingeschränkter Gmail-Scope**. Für Nutzer außerhalb Ihrer Organisation ist eine **Google-Verifizierung** nötig; bis dahin Testnutzer verwenden.
4. **Anmeldedaten** → **OAuth-Client-ID** erstellen, Typ **Webanwendung**.
5. **Autorisierte Redirect-URIs**: exakt `http://localhost:3001/v1/connectors/oauth/callback` (lokal) und Ihre Produktions-URI (siehe Tabelle oben).
6. Client-ID und Secret in `DOCUVATE_GMAIL_OAUTH_CLIENT_ID` / `DOCUVATE_GMAIL_OAUTH_CLIENT_SECRET` speichern.
7. API neu starten. In Docuvate unter **Einstellungen → Connectors** sollte „Verbinden“ für Google Mail aktiv sein.

## Microsoft Entra (Azure AD)

1. **App-Registrierung** → Neue Registrierung.
2. **Unterstützte Kontotypen**: „Konten in einem beliebigen Organisationsverzeichnis und persönliche Microsoft-Konten“ (entspricht `/common/` im Code, Multi-Tenant + persönliche Konten).
3. **Plattform** → **Web** → Redirect-URI wie in der Tabelle oben.
4. **Zertifikate & Geheimnisse** → Neues Client Secret → Wert in `DOCUVATE_OUTLOOK_OAUTH_CLIENT_SECRET`.
5. **Anwendungs-ID (Client)** → `DOCUVATE_OUTLOOK_OAUTH_CLIENT_ID`.
6. **API-Berechtigungen** → Microsoft Graph → **Delegierte Berechtigungen**:
   - `Mail.Read`
   - `offline_access` (Refresh-Token; wird oft automatisch mit angefordert)
7. Admin-Einwilligung erteilen, falls Ihre Richtlinie das verlangt.
8. API neu starten und Outlook-Connector testen.

## Prüfen

1. Catalog-API: `GET /v1/connectors/catalog` — für Gmail/Outlook `auth.oauth.configured: true` und leeres `missingEnvVars`.
2. UI: **Mit Anbieter verbinden** → Redirect zu Google bzw. Microsoft.
3. Nach Anmeldung: Rückkehr zu `/settings/connectors?oauth=success`, Installation sichtbar.

Weitere Architektur: [connectors.md](./connectors.md), [ADR 009](./adr/009-connector-plugin-system.md).
