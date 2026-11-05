# Design system

Docuvate is a dense, calm tool for filing and finding documents. The UI favours scanning speed and trust over decoration: warm stone-grey surfaces, one vermilion accent, IBM Plex type and a strict grid.

All values come from the design tokens in [`packages/tokens`](../packages/tokens) (see [Design tokens](design-tokens.md)). Apps consume them as `--dv-*` CSS variables. Do not hard-code colours or sizes, and do not fork a parallel theme system. The living catalog at **`/docs/styles`** (`@docuvate/ui-catalog`) is generated from the same token sources and shows every token, every primitive and its usage rules.

## Principles

1. **Calm surfaces, one accent.** Warm stone neutrals carry the layout; vermilion (`#d9480f`) marks the single primary action, the active place and focus. Never use the accent for decoration.
2. **Hierarchy through type and space, not boxes.** One `h1` per page (the `page-title` type role), then section titles. Separate groups with the spacing scale before reaching for borders, cards or colour.
3. **Stable layouts.** Hover, focus, selected, loading and error states never change an element's size or position. Reserve space for async content.
4. **Accessible by default.** WCAG AA contrast (enforced by token tests), a visible 2px focus ring on every control, 44px touch targets below 768px and full reduced-motion support.
5. **Tokens are the API.** Styles reference `--dv-*` tokens only. New values are added to `packages/tokens` with a reason, never inlined in a component.

## Colour

The palette is **frozen** (`packages/tokens/governance/color-freeze.json`); the token tests fail on any change. Light and dark always define the same roles.

| Role            | Token                      | Light     | Dark      |
| --------------- | -------------------------- | --------- | --------- |
| Page background | `--dv-color-bg`            | `#f5f1e9` | `#1e1a13` |
| Raised surface  | `--dv-color-bg-raised`     | `#fffaf5` | `#262118` |
| Muted surface   | `--dv-color-bg-muted`      | `#e3dbd0` | `#3d362c` |
| Text            | `--dv-color-text`          | `#120f09` | `#f5f1ea` |
| Secondary text  | `--dv-color-text-muted`    | `#5c5348` | `#c9bfb0` |
| Border          | `--dv-color-border`        | `#d9d0c4` | `#3d362c` |
| Strong border   | `--dv-color-border-strong` | `#b8aea1` | `#524a3d` |
| Accent          | `--dv-color-accent`        | `#d9480f` | `#d9480f` |
| Accent (hover)  | `--dv-color-accent-hover`  | `#b8320a` | `#ffb088` |
| Accent text     | `--dv-color-accent-text`   | `#a8380b` | `#f4875a` |
| Focus ring      | `--dv-color-focus`         | `#d9480f` | `#d9480f` |
| Success         | `--dv-color-ok`            | `#065f46` | `#34d399` |
| Warning         | `--dv-color-warn`          | `#b45309` | `#fbbf24` |
| Danger          | `--dv-color-danger`        | `#b91c1c` | `#f87171` |

Inbox, suggestion and label-preset colours have their own tokens (see the catalog). Use `--dv-color-accent` for fills and `--dv-color-accent-text` for accent-coloured text and links. Themes switch with `data-docuvate-theme` (`light` | `dark`) on `<html>`.

## Type

- **IBM Plex Sans** for UI text, **IBM Plex Mono** for code and identifiers.
- Use the **semantic type roles** (`--dv-type-<role>-size|line-height|weight|tracking`): `display`, `page-title`, `section-title`, `card-title`, `body`, `lead`, `label`, `caption`, `overline`. Fall back to the `--dv-font-size-*` scale only when no role fits. Never set font sizes in pixels or raw rem.
- Labels are short nouns (Rechnung, Versicherung, Fahrzeug), not verb phrases.

## Size, spacing and shape

- **8px rhythm.** Spacing comes from `--dv-space-*` (2xs 4px … 3xl 72px); layout gaps from `--dv-layout-section-gap` / `--dv-layout-stack-gap`.
- **Control heights:** `--dv-control-height-sm` 32px, `--dv-control-height` 40px, `--dv-control-height-lg` 44px. Below 768px `--dv-control-height` becomes `--dv-control-touch-target` (44px), so any control sized with it is touch-compliant automatically.
- **Inline text actions** (standalone text links and `summary` toggles) use `min-height: var(--dv-control-inline-target)` (24px, WCAG 2.5.8) on desktop so table rows keep their height, and `var(--dv-control-touch-target)` (44px) below 768px.
- **Radii** stay at or below 12px: use the aliases `--dv-radius-control`, `--dv-radius-surface`, `--dv-radius-badge`, `--dv-radius-chip`. No pill-shaped controls.
- **Borders and focus:** `--dv-border-width-hairline` / `thick`; focus rings use `--dv-focus-ring-width` (2px) and `--dv-focus-ring-offset` with `--dv-color-focus`.
- **Elevation:** `--dv-elevation-0…4` (flat → overlay). Cards use `elevation-1`; popovers `elevation-3`; dialogs `elevation-4`.
- **Layers:** z-index only via `--dv-z-*` (base, sticky, dropdown, drawer, modal, popover, toast).
- **Motion:** `--dv-motion-duration-instant|fast|normal|slow` with `--dv-motion-easing-standard|emphasized|enter|exit`. `prefers-reduced-motion: reduce` collapses all animation and transition durations (emitted by the token build).
- **States:** `--dv-state-disabled-opacity`, `--dv-state-hover-mix`, `--dv-state-pressed-mix`, `--dv-state-selected-mix`.

## Layout

- A 12-column grid on desktop and tablet and 4 columns on mobile, with token-defined gutters and margins.
- Page width `--dv-layout-page-max` (wide views `--dv-layout-page-wide-max`), padding `--dv-layout-page-pad` (`-mobile` below 768px), readable text width `--dv-layout-readable-max`.
- Dialogs share `--dv-layout-dialog-width` (35rem).
- Forms with unsaved changes use the shared save bar and confirm with a short "saved" state.

## Rollout scope

The design system is rolled out incrementally. In this first pass:

- **Migrated:** app shell (top bar brand, sidebar), dashboard, labels, review queue, saved views, duplicates, recognized fields and settings use the primitives, type roles, control heights and motion tokens.
- **Unchanged: library and document viewer.** Their markup, layout and type sizes are untouched (the font-size / radius / transition codemod was deliberately not applied to their selectors). They only pick up (a) the shared primitives they already used (`Button`, `Input`, `Card`, `Chip`: hover/focus transitions, disabled opacity token, uncoloured-chip contrast fix), (b) repaired references to previously undefined CSS variables, which browsers had silently dropped (e.g. `--dv-color-bg-hover` → `--dv-color-bg-overlay`, `--dv-font-mono` → `--dv-font-family-mono`), and (c) an accessible name on the extraction progress bar. Migrating them is a separate follow-up.

## Components

Reusable components live in `apps/web/src/components/ui`. Use them instead of styling raw elements.

| Primitive                                       | Use for                                                                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `PageHeader`                                    | Every top-level page: title (`h1`, `data-ux="page-title"`), optional eyebrow, lead and an actions slot.                                    |
| `Card`, `CardHeader`                            | Grouped content; `variant` raised / outlined / muted, `padding` none–lg.                                                                   |
| `Toolbar`, `ToolGroup`                          | Rows of related actions; `ToolGroup attached` for segmented button groups. Give the toolbar an `aria-label`.                               |
| `Button`, `IconButton`                          | One primary per view; secondary/ghost for the rest; icon buttons always have a label.                                                      |
| `Input`, `Select`, `SearchField`, `FormField`   | Form controls; `FormField` wires label, help and error (`htmlFor`).                                                                        |
| `TabBar` / `Tab`                                | Switching views within a page.                                                                                                             |
| `ToneBadge`, `Badge`, `Chip`                    | `ToneBadge`/`Badge` for system status; `Chip` for user-defined labels only.                                                                |
| `InlineStatus`, `Alert`, `Skeleton`, `Progress` | Feedback: inline loading/empty/success/warn/error (`role=status`/`alert`), banners, reserved loading space. `Progress` requires a `label`. |
| `Dialog`, `ConfirmDialog`                       | Modal tasks at the shared dialog width.                                                                                                    |

Do/don't guidance for each primitive lives next to its live demo in the catalog (`packages/ui-catalog/src/guidelines.ts`).

## Governance

- **Colour is frozen.** Changing a colour requires updating `color-freeze.json` in the same PR with design sign-off.
- **New tokens need a reason.** Add the value to `packages/tokens/tokens/*.json` with a `comment`; the build rejects duplicate names and the tests reject duplicate primitive values, off-grid spacing, radii above 12px and touch targets below 44px.
- **No undefined variables.** `apps/web` fails CI when CSS references an undefined `--*` variable without a fallback (`scripts/check-design-tokens.mjs`).
- **Ratchet, never grow.** Raw font sizes, radii, shadow colours, transition timings and rgb/hsl literals in app CSS may only go down (`scripts/design-token-baseline.json`). Lower the baseline with `node scripts/check-design-tokens.mjs --update` after cleaning up.
- **Regression coverage.** `e2e/tests/design-system` checks the palette at runtime, focus rings, reduced motion, page-title consistency, axe WCAG A/AA (serious + critical), mobile touch targets (labels page scanned in full, including its text links, plus desktop row-height guard) on synthetic fixtures, and writes desktop/mobile × light/dark screenshots. It runs in CI as the `design-system-e2e` job (`.github/workflows/ci.yml`) whenever web, tokens, ui-catalog, contracts or the suite change; screenshots and traces are uploaded as the `design-system-e2e` artifact on failure.

## Anti-patterns

- Hard-coded colours, pixel sizes, one-off radii or z-indexes.
- Ad-hoc `<header className="page-header">` markup instead of `PageHeader`.
- Gradients, oversized rounded tags or decorative illustrations in the app.
- Layout shifts between interaction states.
- English-only copy on German screens (all UI text goes through i18n).
