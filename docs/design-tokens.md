# Design tokens

Docuvate design tokens live in **`packages/tokens`**. They are built with [Style Dictionary](https://styledictionary.com/) from JSON sources under `packages/tokens/tokens/`.

## Outputs

| Output | Path | Consumption |
|--------|------|-------------|
| CSS variables (`--dv-*`) | `packages/tokens/dist/css/tokens.css` | `@import '@docuvate/tokens/css'` in apps |
| TypeScript constants | `packages/tokens/dist/js/tokens.js` | `import { tokens, labelDefaultColor } from '@docuvate/tokens'` |
| Flutter / Dart | `packages/tokens/dist/dart/docuvate_tokens.dart` | Future Flutter SDK |

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
pnpm --filter @docuvate/tokens test   # WCAG AA contrast pairs (4.5:1)
```

Edit JSON under `packages/tokens/tokens/` only. Do not hand-edit `dist/`.

## Styles catalog

The living catalog (no Storybook) is implemented as **`@docuvate/ui-catalog`** and mounted in the web app at **`/docs/styles`**. When the public docs site (`apps/site`) exists, it should import the same package and token CSS.

## Lint

`apps/web` runs **stylelint** on `src/**/*.css` with `color-no-hex` and radius guards. User-defined label hex colors belong in TS/data, not in app stylesheets.

## Local stack (screenshots / QA)

With Docker available (`DOCKER_HOST` if remote daemon):

```bash
export DOCKER_HOST=tcp://127.0.0.1:2375   # when needed
docker compose -f docker-compose.yml -f docker-compose.screenshots.yml up -d postgres valkey minio worker api
pnpm --filter @docuvate/web dev
```

`docker-compose.screenshots.yml` skips the Ollama pull for faster API boot; auth uses `/api/auth` via the Vite proxy (see `apps/web/vite.config.ts`).
