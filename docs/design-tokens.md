# Design tokens

Docuvate design tokens live in **`packages/tokens`**. They are built with [Style Dictionary](https://styledictionary.com/) from JSON sources under `packages/tokens/tokens/`.

## Outputs

| Output | Path | Consumption |
|--------|------|-------------|
| CSS variables (`--dv-*`) | `packages/tokens/dist/css/tokens.css` | `@import '@docuvate/tokens/css'` in apps |
| TypeScript constants | `packages/tokens/dist/js/tokens.js` | `import { tokens, labelDefaultColor } from '@docuvate/tokens'` |
| Token catalog | `tokenCatalog`, `colorCatalog` exports | Generated catalog (`/docs/styles`), tests |
| Flutter / Dart | `packages/tokens/dist/dart/docuvate_tokens.dart` | Future Flutter SDK |

## Sources

| File | Groups |
|------|--------|
| `color.json` | Themed colour roles (light / dark). Frozen by `governance/color-freeze.json`. |
| `space.json` | `space` scale, `control` heights / paddings / touch target, `layout` (page, topbar, sidebar, dialog, readable width, gaps), `grid`, `breakpoint` |
| `typography.json` | Font families, `font.size` scale, weights, line heights, tracking |
| `type.json` | Semantic type roles (`display`, `page-title`, `section-title`, `card-title`, `body`, `lead`, `label`, `caption`, `overline`) as aliases |
| `radius.json` | `xs`–`lg` plus aliases `control`, `surface`, `badge`, `chip` |
| `border.json` | Border widths and focus-ring width / offsets |
| `shadow.json` | Shadows plus `elevation.0–4` aliases |
| `motion.json` | Durations and easing curves |
| `layer.json` | `z` stacking layers |
| `state.json` | Disabled opacity and hover / pressed / selected mix amounts |

Aliases use Style Dictionary references (`"{space.md}"`). In CSS they become `var(--dv-space-md)` so the relationship stays visible in devtools; TS and Dart receive the resolved literal.

## Themes

Light and dark themes use the **`data-docuvate-theme`** attribute on `<html>` (`light` | `dark`). Color tokens are theme-specific; spacing, radius, typography, shadow, and motion are shared.

User preference is persisted in `localStorage` (`docuvate-theme`). Toggle: avatar menu → Light / Dark theme.

## Naming

- Prefix: **`--dv-`** (e.g. `--dv-color-accent`, `--dv-space-md`, `--dv-radius-lg`).
- Radius scale capped at **12px** (`sm` 4, `md` 8, `lg` 12). No pill / `9999` radii in product UI.

## Rebuild

```bash
./scripts/packages.sh tokens
# or
pnpm --filter @docuvate/tokens build
pnpm --filter @docuvate/tokens test   # WCAG AA contrast + governance (palette freeze, scales, sync)
```

Edit JSON under `packages/tokens/tokens/` only. Do not hand-edit `dist/`.

## Styles catalog

The living catalog (no Storybook) is implemented as **`@docuvate/ui-catalog`** and mounted in the web app at **`/docs/styles`**. When the public docs site (`apps/site`) exists, it should import the same package and token CSS.

## Lint and guards

- `apps/web` runs **stylelint** on `src/**/*.css` with `color-no-hex` and radius guards. User-defined label hex colors belong in TS/data, not in app stylesheets.
- `apps/web/scripts/check-design-tokens.mjs` (part of `pnpm test`) fails on undefined custom properties and ratchets raw literals against `design-token-baseline.json`.
- `apps/web/scripts/codemod-design-tokens.mjs` rewrites raw font sizes, transition timings and exact radius values to tokens (idempotent; `--check` for CI-style dry runs). It has not been applied to library or document-viewer selectors yet; run it there only as part of their migration.
- `packages/tokens/governance.test.mjs` enforces the palette freeze, light/dark parity, kebab-case names, no hex in static tokens, no duplicate primitive values, 4px-grid spacing, radius ≤ 12px, touch target ≥ 44px and that `dist/` is in sync.

## Local stack (screenshots / QA)

With Docker available (`DOCKER_HOST` if remote daemon):

```bash
export DOCKER_HOST=tcp://127.0.0.1:2375   # when needed
docker compose -f docker-compose.yml -f docker-compose.screenshots.yml up -d postgres valkey minio worker api
pnpm --filter @docuvate/web dev
```

`docker-compose.screenshots.yml` skips the Ollama pull for faster API boot; auth uses `/api/auth` via the Vite proxy (see `apps/web/vite.config.ts`).
