# Docuvate Design System

Docuvate should feel like a **serious Beleg-OS** (NN/g): dense, trustworthy, optimized for scanning and filing, not a consumer soft UI.

## Tone

- Calm **slate** surfaces, one **ink indigo** primary (`--color-primary`, ~`#2F3E8C`).
- **IBM Plex Sans** for UI copy; German labels in product surfaces.
- Labels are short nouns (Rechnung, Versicherung, Fahrzeug), not verb phrases.

## Tokens (`apps/web/src/styles/tokens.css`)

| Token | Role |
| --- | --- |
| `--radius-sm` … `--radius-max` (≤12px) | Cards, inputs, chips. No pill blobs |
| `--radius-chip` (8px) | Assigned / inbox / suggest chips |
| `--color-primary` | Top bar, primary actions, sidebar active |
| `--color-inbox*` | Posteingang chip |
| `--color-suggest*` | Vorschlags-Chips, duplicate hint |
| `--shadow-sm`, `--elevation-bar` | Subtle elevation only |

Extend tokens here. Do not fork a parallel theme system.

## Layout

- **Left sidebar**: Posteingang, Dokumente, Ordner tree, Struktur (Labels, Korrespondenten, Dokumenttypen), Einstellungen.
- **Top bar**: global search + account only (no peer nav tabs).

## Components

| Component | Usage |
| --- | --- |
| `Button` | Primary / secondary / ghost |
| `Input` | Forms, search |
| `Select` | Custom dropdown (matches Input styling) |
| `Chip` | Tags (assigned, inbox, suggest, outline) |
| `Dropzone` | Upload |
| `Card` | Panels |
| `Badge` | Pipeline status (not tags) |
| `LabelPanel` | Document detail: assigned chips, picker, suggestions |
| `PdfViewer` | pdf.js canvas + selectable text layer |

## Anti-patterns

- Border-radius > 12px on interactive controls or chips.
- Pastel gradient hero sections or oversized rounded tags.
- Using `Badge` for user-defined labels (use `Chip`).
- English-only copy on user-facing DE screens.
- User-facing word **Nomen** (internal guidance only).

## Reference

Paperless-ngx parity for filter bar, colored rectangular tags, and matching dialog: see `docs/parity-paperless.md`.
