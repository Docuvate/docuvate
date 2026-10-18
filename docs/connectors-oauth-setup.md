# Gmail and Outlook OAuth setup

This guide explains how to configure OAuth client credentials for the **Google Mail** and **Microsoft Outlook** mail connectors. Without these variables, "Connect" stays disabled in the UI.

## Overview

| Provider  | Authorization endpoint                                           | Token endpoint                                               | Scopes                                           |
| --------- | ---------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| Google    | `https://accounts.google.com/o/oauth2/v2/auth`                   | `https://oauth2.googleapis.com/token`                        | `https://www.googleapis.com/auth/gmail.readonly` |
| Microsoft | `https://login.microsoftonline.com/common/oauth2/v2.0/authorize` | `https://login.microsoftonline.com/common/oauth2/v2.0/token` | `offline_access`, `Mail.Read`                    |

Additional authorization parameters for Google: `access_type=offline`, `prompt=consent` (refresh token).

The flow uses **PKCE (S256)** and a signed **state** valid for 15 minutes, and stores tokens **encrypted** (`DOCUVATE_CONNECTOR_SECRETS_KEY`).

## Redirect URIs (enter exactly in the provider console)

The callback is handled by the **API** (`GET /v1/connectors/oauth/callback`), not by the Vite dev server.

| Environment                            | Redirect URI                                             |
| -------------------------------------- | -------------------------------------------------------- |
| Local development (API on port 3001)   | `http://localhost:3001/v1/connectors/oauth/callback`     |
| Docker Compose (API published on 3001) | `http://localhost:3001/v1/connectors/oauth/callback`     |
| Production behind nginx (`/api` → API) | `https://YOUR-HOSTNAME/api/v1/connectors/oauth/callback` |

You can set the URI explicitly:

```bash
DOCUVATE_CONNECTOR_OAUTH_REDIRECT_URI=https://YOUR-HOSTNAME/api/v1/connectors/oauth/callback
```

Or set the public API base URL (without `/v1`):

```bash
DOCUVATE_API_PUBLIC_URL=https://YOUR-HOSTNAME/api
# → callback becomes …/v1/connectors/oauth/callback
```

After a successful OAuth flow the API redirects to `WEB_ORIGIN` (default `http://localhost:5173`) → `/settings/connectors?oauth=success`.

## Environment variables

| Variable                                | Description                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| `DOCUVATE_GMAIL_OAUTH_CLIENT_ID`        | Google OAuth client ID (web client)                                              |
| `DOCUVATE_GMAIL_OAUTH_CLIENT_SECRET`    | Google client secret                                                             |
| `DOCUVATE_OUTLOOK_OAUTH_CLIENT_ID`      | Microsoft application (client) ID                                                |
| `DOCUVATE_OUTLOOK_OAUTH_CLIENT_SECRET`  | Microsoft client secret                                                          |
| `DOCUVATE_CONNECTOR_SECRETS_KEY`        | AES key for encrypted connector credentials (at least 32 characters recommended) |
| `DOCUVATE_CONNECTOR_OAUTH_REDIRECT_URI` | Optional: exact callback URL                                                     |
| `DOCUVATE_API_PUBLIC_URL`               | Optional: public API base URL used to derive the callback                        |
| `WEB_ORIGIN`                            | Where to return after OAuth (web app origin)                                     |

`docker-compose.yml` passes the Gmail and Outlook variables to the `api` service (`${VAR:-}`). Set them in `.env` in the repository root or export them.

## Google Cloud Console

1. Create or select a **project**.
2. Enable the **Gmail API** (APIs & Services → Library → "Gmail API").
3. Configure the **OAuth consent screen** (external or internal).
   - While testing, add **test users**; only these accounts can sign in until the app is verified.
   - `https://www.googleapis.com/auth/gmail.readonly` is a **restricted Gmail scope**. Users outside your organization require **Google verification**; use test users until then.
4. **Credentials** → create an **OAuth client ID** of type **Web application**.
5. **Authorized redirect URIs**: exactly `http://localhost:3001/v1/connectors/oauth/callback` (local) and your production URI (see the table above).
6. Store the client ID and secret in `DOCUVATE_GMAIL_OAUTH_CLIENT_ID` and `DOCUVATE_GMAIL_OAUTH_CLIENT_SECRET`.
7. Restart the API. Under **Settings → Connectors**, "Connect" for Google Mail should now be enabled.

## Microsoft Entra ID

1. **App registrations** → New registration.
2. **Supported account types**: "Accounts in any organizational directory and personal Microsoft accounts" (matches `/common/` in the code: multi-tenant plus personal accounts).
3. **Platform** → **Web** → redirect URI as in the table above.
4. **Certificates & secrets** → new client secret → value into `DOCUVATE_OUTLOOK_OAUTH_CLIENT_SECRET`.
5. **Application (client) ID** → `DOCUVATE_OUTLOOK_OAUTH_CLIENT_ID`.
6. **API permissions** → Microsoft Graph → **Delegated permissions**:
   - `Mail.Read`
   - `offline_access` (refresh token; often requested automatically)
7. Grant admin consent if your policy requires it.
8. Restart the API and test the Outlook connector.

## Verify

1. Catalog API: `GET /v1/connectors/catalog` returns `auth.oauth.configured: true` and an empty `missingEnvVars` for Gmail and Outlook.
2. UI: **Connect with provider** redirects to Google or Microsoft.
3. After signing in you return to `/settings/connectors?oauth=success` and the installation is listed.

More on the architecture: [connectors.md](./connectors.md), [ADR 009](./adr/009-connector-plugin-system.md).
