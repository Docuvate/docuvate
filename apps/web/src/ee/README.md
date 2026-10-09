# Docuvate Enterprise Edition (Web)

UI and client code under `apps/web/src/ee/` is **Enterprise Edition (EE)** and falls under
[LICENSE_EE.md](../../../../LICENSE_EE.md).

Use `readEnterpriseFeatureFlags()` for EE-only UI. Community Edition builds return all flags as
`false` so the app works without a license key.
