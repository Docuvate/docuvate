# Local CI (mirror `.github/workflows/ci.yml`)

GitHub Actions may be disabled; run the same jobs locally and post results on the PR.

**Prerequisites:** Runtimes from `.tool-versions` (asdf: `asdf install`), and Docker.

## Runner

```bash
./scripts/ci/run-local-ci-jobs.sh
```

Optional wrapper: `./scripts/ci/run-local-ci.sh` sources `scripts/ci/agent-docker-forward.sh` when `CI_ENABLE_DOCKER_FORWARD=1` (same as the wrapper script on main).

Each job runs in a subshell with `set -euo pipefail` so **any** failing step fails the job (not only the last command). At the start of **lint-test**, `scripts/ci/test-run-job.sh` and `scripts/ci/check-no-and-chains.sh` verify runner behavior and forbid `&&` / `||` chains in job bodies (bash errexit blind spot).

Results are written to `tmp/local-ci-results.tsv` with PASS/FAIL, duration, and cheap test-count snippets (vitest / pytest / Playwright summary lines from the job log).

Each runner invocation gets a unique `DOCUVATE_LOCAL_CI_RUN_ID`. Jobs run **sequentially**; each job uses its own ephemeral Postgres (dynamic host port, Docker labels) or its own `COMPOSE_PROJECT_NAME` (`docuvate_lc_<run>_<job>`). Before jobs that bind fixed host ports, the runner **fails fast** if a port is taken and prints which container holds it. On exit, the runner removes only its own compose projects and labeled containers (never `docker compose down` on foreign project names).

**lint-test** and **db-migrate-fresh** use a dedicated ephemeral Postgres each (never shared). **db-migrate-fresh** prepends a `psql` shim (`docker exec -i`, default `-v ON_ERROR_STOP=1`) that only accepts `DATABASE_URL`-style calls (no `-h`/`-p`/`-U`); see `scripts/ci/test-docker-psql-shim.sh`.

**docker-build** and **compose-smoke** share one compose project (`docuvate_lc_<run>_stack`) and image tags from `scripts/ci/docker-compose.local-ci.yml`. Runner cleanup uses `docker compose down --rmi local -v` on owned projects only.

**compose-smoke** fails fast if fixed ports (e.g. **8025** Mailpit, **3001**, **5173**, **5433**) are taken, naming the holding container.

## Cloud Agent VM Docker networking (opt-in only)

On **Cursor Cloud Agent VMs** only, inter-container traffic may fail (`iptables-legacy FORWARD DROP`). **Do not** run this on Mac or production hosts.

Export `DV_AGENT_VM=1` before the local CI runner (the runner calls the setup script only when that variable is set):

```bash
export DV_AGENT_VM=1
sudo -E ./scripts/ci/agent-vm-docker-setup.sh
DV_AGENT_VM=1 ./scripts/ci/run-local-ci-jobs.sh
```

The agent setup applies `iptables-legacy -P FORWARD ACCEPT` and `iptables -P FORWARD ACCEPT`, then verifies with a two-container ping. It is **not** invoked unconditionally by `run-local-ci-jobs.sh`.

Mac / local Docker Desktop: use normal Docker; skip the agent script unless you explicitly opt in.

## Jobs

| Workflow job | Local command (summary) |
|--------------|-------------------------|
| **lint-test** | `pnpm install`, Flutter, steps in `.github/workflows/ci.yml` |
| **db-migrate-fresh** | `postgres:18.6-alpine` + migration roundtrip check |
| **integration-test** | API integration tests + worker integration pytest |
| **docker-build** | `docker compose -f docker-compose.yml build web api` |
| **compose-smoke** | `docker compose -f docker-compose.yml -f docker-compose.ci.yml up -d --build …` |

Use **`docker compose --progress plain`** (Compose v5) when you want full build logs.
