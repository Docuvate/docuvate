# UX metrics harness

Docuvate ships a local Playwright harness that quantifies **model-based** UX signals on the compose stack. These numbers support before/after comparisons when layout work lands; they are **not** a substitute for user testing.

## Layout measurement contract

Customer shell pages expose stable landmarks (unification target):

| Landmark | Attribute |
|----------|-----------|
| Content page root | `[data-ux="page"]` |
| Page title | `[data-ux="page-title"]` |
| Primary action | `[data-ux="primary-action"]` |

If a landmark is missing, the report lists it under **Missing landmarks** with `null` geometry (not as 0px drift). Dev-only routes such as `/docs/styles` are measured separately and **excluded** from customer layout variance.

## Run

```bash
docker compose -f docker-compose.yml -f docker-compose.ci.yml up -d --build postgres minio minio-init valkey api web
pnpm install
pnpm ux:metrics
```

If Docker bridge traffic fails on a Cloud Agent VM (opt-in, not Mac/production):

```bash
DV_AGENT_VM=1 bash scripts/ci/agent-vm-docker-setup.sh
```

Outputs:

- **Gitignored** `tools/ux-metrics/output/`: `ux-metrics.json`, `ux-metrics-report.html`, ephemeral screenshots
- **Committed baseline** `tools/ux-metrics/baseline/`: `ux-metrics-baseline.json`, `ux-metrics-report.md`, route-named screenshots (e.g. `layout-document-detail-1440.png`)

Seed user (synthetic): `katalog.metrik@lokal.invalid` / `MetrikLauf7!` via `tools/ux-metrics/seed.mjs`.

### Modes

| Flag | Purpose |
|------|---------|
| `--update-baseline` | Refresh `baseline/ux-metrics-baseline.json`, `baseline/ux-metrics-report.md`, screenshots, and merge gate keys in `ux-budgets.json` |
| `--check` | Fail on regressions vs baseline (see gates below) |
| `--skip-seed` | Reuse DB state (`SKIP_LABELS_SEED=1`, still resolves document id) |
| `--web=http://localhost:5173` | Override web origin |

Default GitHub CI does **not** run UX metrics. Local full CI:

```bash
bash scripts/ci/run-local-ci-jobs.sh           # lint-test, migrate, integration, docker-build, compose-smoke
bash scripts/ci/run-local-ci-jobs.sh --ux        # adds pnpm ux:metrics -- --check
```

### Updating the baseline intentionally

1. Merge or rebase your layout work onto `main`.
2. Run compose with seeded data.
3. `pnpm ux:metrics -- --update-baseline`
4. Commit `baseline/ux-metrics-baseline.json`, `baseline/ux-metrics-report.md`, baseline screenshots, and the updated `ux-budgets.json` metric keys.
5. Review the Markdown diff before merging.

## Gates (`--check`)

| Area | Rule |
|------|------|
| Layout (customer) | Each stored per-page metric within **±2px** of baseline |
| Target size | WCAG 2.5.8 failure counts must **not increase** (desktop/mobile) |
| CLS | Each probed interaction stays **0** (tolerance 0.0001) |
| axe | Violation node count must **not increase** |
| Fitts ΣID (desktop tasks) | Must not increase by more than **5%** per task |
| KLM predicted time | Must not increase by more than **5%** per task |

## Metrics (summary)

### Fitts's law (Shannon ID)

\[
ID = \log_2\left(\frac{D}{W} + 1\right)
\]

Summed per task; MT = 50 + 150 × ID ms (MacKenzie, 1992, model estimate). Report includes every segment: from → to, distance, width, ID.

### KLM-GOMS

Operator sequence per task (Card, Moran & Newell, 1983).

### Target sizes

WCAG 2.5.8 (24×24 CSS px) and primary control height ≥40px. Full failure list in the report.

### Stability

CLS for account menu, row select, dirty recognized fields, **SaveBar appears**, **search palette opens**.

### Hick-Hyman

Informational visible choice counts only.

## Limits

- Model estimates assume expert, error-free execution.
- German UI (`de` locale) drives selectors.
- Keyboard shortcut tests use **Ctrl+K** (Linux/Windows); macOS runners may need adjustment later.
