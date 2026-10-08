# Threat model (stub)

- Documents are PII; restrict object storage buckets; worker not exposed publicly in production.
- Session cookies: `Secure` + `SameSite` in production; `httpOnly` via better-auth defaults.
- Enforce `user_id` on all document queries (integration test recommended).
- Secrets via environment only; no credentials in repo.
- Rate-limit login via Valkey in a later iteration.
