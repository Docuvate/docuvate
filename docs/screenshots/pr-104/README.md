# PR #104 — Folders-only tree and drag-and-drop (O1–O3)

Screens for Figma threads #59 and #60:

| Screen | Description |
|--------|-------------|
| **O1** | Dateisystem folder view with Ordner tiles and documents |
| **O1b** | Document drag over a folder target (ghost + drop hint) |
| **O2** | Empty folder drop zone (Reisekosten) |
| **O3** | Move dialog (`MoveDocumentsFolderDialog`) via bulk **Verschieben** |

Each PNG is named `{O1|O1b|O2|O3}-{de|en}-{light|dark}-{1440|1024|390}.png`.

## Regenerate

With Docker Compose (API + Postgres) and the web dev server on port 5173:

```bash
node tools/screenshots/ordnerbaum/seed.mjs
SCREENSHOT_DIR=docs/screenshots/pr-104 node tools/screenshots/folders-pr-d/capture.mjs
```
