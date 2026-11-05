# @docuvate/ui-catalog

The Docuvate design-system catalog: principles, every token (generated from `@docuvate/tokens` `tokenCatalog` / `colorCatalog`), live primitive demos with usage guidelines (when to use, states, do / don't) and governance rules.

The catalog is **not** Storybook: it is a React module meant for the future docs site (`apps/site`, Vite + prerender). Today it is mounted at `/docs/styles` inside `apps/web`, which passes real UI components from the app as props (`StylesCatalogComponents`).

- `src/StylesCatalog.tsx`: page sections (hero with theme toggle, principles, colour, type roles, spacing / controls / layout, radius / border / focus, elevation / layers, motion, components, governance, full token reference).
- `src/guidelines.ts`: `DESIGN_PRINCIPLES`, `COMPONENT_GUIDELINES`, `GOVERNANCE_RULES`. Add a guideline here when a new primitive lands.
- `src/styles-catalog.css`: catalog-only layout, tokens only.

`pnpm --filter @docuvate/ui-catalog typecheck` runs strict TypeScript. Coverage lives in `apps/web/src/pages/StylesDocsPage.spec.tsx` (every token rendered, every guideline complete) and `e2e/tests/design-system`.

When `apps/site` exists, depend on `@docuvate/ui-catalog`, import `@docuvate/tokens/css`, and provide the same `StylesCatalogComponents` map from shared UI exports.
