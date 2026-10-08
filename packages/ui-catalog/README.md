# @docuvate/ui-catalog

Design-system catalog sections (colors, typography, spacing, radius, component showcase).

The catalog is **not** Storybook: it is a React module meant for the future docs site (`apps/site`, Vite + prerender). Today it is mounted at `/docs/styles` inside `apps/web`, which passes real UI components from the app as props.

When `apps/site` exists, depend on `@docuvate/ui-catalog`, import `@docuvate/tokens/css`, and provide the same `StylesCatalogComponents` map from shared UI exports.
