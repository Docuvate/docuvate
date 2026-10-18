# Design system

Docuvate is a dense, calm tool for filing and finding documents. The UI favours scanning speed and trust over decoration: warm stone-grey surfaces, one vermilion accent, IBM Plex type and a strict grid.

All values come from the design tokens in [`packages/tokens`](../packages/tokens) (see [Design tokens](design-tokens.md)). Apps consume them as `--dv-*` CSS variables. Do not hard-code colours or sizes, and do not fork a parallel theme system.

## Colour

| Role            | Token                     | Light     | Dark      |
| --------------- | ------------------------- | --------- | --------- |
| Page background | `--dv-color-bg`           | `#f5f1e9` | `#1e1a13` |
| Raised surface  | `--dv-color-bg-raised`    | `#fffaf5` | `#262118` |
| Muted surface   | `--dv-color-bg-muted`     | `#e3dbd0` | `#3d362c` |
| Text            | `--dv-color-text`         | `#120f09` | `#f5f1ea` |
| Secondary text  | `--dv-color-text-muted`   | `#5c5348` | `#c9bfb0` |
| Border          | `--dv-color-border`       | `#d9d0c4` | `#3d362c` |
| Accent          | `--dv-color-accent`       | `#cb3a00` | `#e96f49` |
| Accent (hover)  | `--dv-color-accent-hover` | `#b52300` | `#cb3a00` |
| Focus ring      | `--dv-color-focus`        | `#cb3a00` | `#e96f49` |

Status colours (`danger`, `ok`, `warn`), the inbox and suggestion colours and the label presets have their own tokens. Use the accent for primary actions, the active navigation item and focus only.

Themes switch with the `data-docuvate-theme` attribute (`light` or `dark`) on `<html>`.

## Type

- **IBM Plex Sans** for UI text, **IBM Plex Mono** for code and identifiers (`--dv-font-family-sans`, `--dv-font-family-mono`).
- Sizes come from the `--dv-font-size-*` scale; never set font sizes in pixels.
- Labels are short nouns (Rechnung, Versicherung, Fahrzeug), not verb phrases.

## Size and spacing

- Everything is specified in **rem**: spacing (`--dv-space-2xs` 0.25rem to `--dv-space-3xl` 4.5rem), radii (`--dv-radius-sm` 0.25rem, `md` 0.5rem, `lg` 0.75rem) and control heights (`--dv-control-height` 2.5rem).
- Radii stay at or below `--dv-radius-lg`; no pill-shaped controls or chips.
- Elevation is subtle (`--dv-shadow-*`).

## Layout

- A 12-column grid on desktop and tablet and 4 columns on mobile, with token-defined gutters and margins.
- Elements stay on the grid. Hover, focus, selected, loading and error states never change an element's size or position.
- Dialogs share one width of 35rem.
- Forms with unsaved changes use the shared save bar and confirm with a short "saved" state.

## Components

Reusable components live in `apps/web/src/components/ui` (for example `Button`, `IconButton`, `Input`, `SearchField`, `Chip`, `Badge`, `Card`, `Dialog`, `SegmentedControl`, `Breadcrumb`). Use them instead of styling raw elements.

- `Chip` is for user-defined labels; `Badge` is for system status.
- New components take their colours, spacing and radii from tokens only.

## Anti-patterns

- Hard-coded colours, pixel sizes or one-off radii.
- Gradients, oversized rounded tags or decorative illustrations in the app.
- Layout shifts between interaction states.
- English-only copy on German screens (all UI text goes through i18n).
