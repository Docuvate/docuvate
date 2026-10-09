# Docuvate Enterprise Edition (API)

Code under `apps/api/src/ee/` is **Enterprise Edition (EE)**.

- **License:** [LICENSE_EE.md](../../../../LICENSE_EE.md) at the repository root (`LicenseRef-Docuvate-EE`).
- **Production use** requires a valid Docuvate Enterprise subscription or license key.
- **Development and testing** may use this code without a key; production checks are enforced via
  `EnterpriseLicenseService` and optional guards.

Community Edition builds omit EE-only routes and features. The hooks here are stubs so CE builds
keep compiling and running without a license key.

**Do not** move existing Community features into this folder unless they are clearly business-only.
See the relicensing pull request for EE candidate features.
