# PR #109 — Passkeys, OIDC SSO, recovery codes, email change

Screens for auth and account security (Figma threads #1, #3, #46):

| Screen | File prefix |
|--------|-------------|
| **A1** | Login with passkey / SSO entry points — `a1-login-{1440\|1024\|390}-{light\|dark}.png` |
| **E8** | Account security settings — `e8-account-security-*` |
| **E8e** | Change email dialog — `e8e-change-email-dialog-*` |
| **E8b** | Regenerate recovery codes dialog — `e8b-regenerate-codes-dialog-*` |
| **E9** | Admin sign-in / OIDC providers — `e9-admin-auth-sign-in-*` |

## Regenerate

With Docker Compose (API + Postgres + Mailpit) and the web dev server on port 5173:

```bash
docker compose -f docker-compose.yml -f docker-compose.screenshots.yml up -d postgres valkey minio mailpit api
pnpm --filter @docuvate/web dev
SCREENSHOT_DIR=docs/screenshots/pr-109 node tools/screenshots/auth-pr-e/capture.mjs
```
