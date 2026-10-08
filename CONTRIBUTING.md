# Contributing to Docuvate

Thank you for helping improve Docuvate. This guide covers local setup, quality checks, and how we review changes.

## Before you start

- Read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
- For security issues, follow [SECURITY.md](SECURITY.md) (no public issues).
- Search existing [issues](https://github.com/Docuvate/docuvate/issues) to avoid duplicate work.

## Development setup

1. Install **Node.js 24+**, **pnpm**, **Docker**, and **uv** (Python worker).
2. Clone the repository and copy environment defaults:

   ```bash
   cp .env.example .env
   pnpm install
   ```

3. Start infrastructure and apps (see [README.md](README.md#quickstart) Quickstart), or run services individually as documented in `apps/worker/README.md`.

## Local CI (same jobs as GitHub Actions)

CI is defined in [.github/workflows/ci.yml](.github/workflows/ci.yml). Run the equivalent steps locally; see [docs/local-ci.md](docs/local-ci.md).

Core commands from the `lint-test` job include:

```bash
pnpm --filter @docuvate/tokens build && pnpm --filter @docuvate/tokens test
pnpm openapi:check && pnpm sdk:check
pnpm --filter @docuvate/api typecheck && pnpm --filter @docuvate/web typecheck
pnpm --filter @docuvate/web lint
pnpm --filter @docuvate/api test && pnpm --filter @docuvate/web test
pnpm format:check
cd apps/worker && uv venv .venv && uv pip install -e ".[dev]" && .venv/bin/ruff check src
```

### Cloud Agent VMs only (throwaway hosts)

If Docker Compose smoke tests fail because containers cannot reach each other (for example `minio-init` or API to Postgres timeouts), the host may have `iptables` **FORWARD DROP**. **Do not change firewall policy on your workstation.**

On **throwaway Cursor Cloud Agent VMs only**, after `dockerd` is running, you may opt in to [`scripts/ci/agent-vm-docker-setup.sh`](scripts/ci/agent-vm-docker-setup.sh):

```bash
DV_AGENT_VM=1 sudo -E scripts/ci/agent-vm-docker-setup.sh
```

That script refuses to run unless `DV_AGENT_VM=1` is set. It is **not** for Mac, Linux desktops, or production servers.

## Architecture rules

- Dependency direction: adapters → application → domain.
- Domain code must not import NestJS, Fastify, better-auth, OpenTelemetry, React, MinIO, or Valkey clients.
- See [docs/architecture.md](docs/architecture.md) and [AGENTS.md](AGENTS.md).

## Commits and pull requests

- Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, …).
- Keep PRs focused; include screenshots for UI changes.
- Fill out the pull request template checklist, including a local CI run against `ci.yml`.

## Contributor License Agreement

By submitting a pull request, you confirm that you have the right to license your contribution under the project license (AGPL-3.0 for community edition code) and you grant Docuvate the rights needed to merge and distribute your contribution. If your employer requires a signed CLA, open a [GitHub issue](https://github.com/Docuvate/docuvate/issues) before large contributions.

## Secret scanning

Run gitleaks before pushing when working with credentials or fixtures:

```bash
gitleaks detect --config .gitleaks.toml --no-git --source .
```

README logo and preview tooling: [docs/readme-assets.md](docs/readme-assets.md).

Optional: install [lefthook](https://github.com/evilmartians/lefthook) and enable the sample hook in `.lefthook.yml` if your team uses it locally.
