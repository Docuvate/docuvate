# Docuvate UX metrics report

Generated: 2026-10-08T18:21:32.163Z
Git SHA: d3d5ef8d99efc9494812960e2fc6c720a2395a6d
Web base: http://localhost:15173
Seed user: katalog.metrik@lokal.invalid

## Top Fitts tasks (model estimate, desktop viewport)

Movement time uses MT = 50 + 150 × ID (ms). Source: MacKenzie, I. S. (1992). Fitts' law as a research and design tool in human-computer interaction. Human-Computer Interaction, 7(1), 91–139.

- **Upload a document** (upload-document): ΣID=12.721, ΣMT≈2008ms
- **Create folder and move a document** (folder-create-move): ΣID=7.895, ΣMT≈1384ms
- **Change document title and save** (document-title-save): ΣID=6.552, ΣMT≈1133ms
- **Create a recognized field** (create-recognized-field): ΣID=6.301, ΣMT≈1095ms
- **Create a label in structure** (create-label): ΣID=5.911, ΣMT≈1037ms
- **Switch theme** (switch-theme): ΣID=5.753, ΣMT≈963ms
- **Assign a label on document detail** (assign-label): ΣID=5.582, ΣMT≈987ms
- **Open a document from the library** (open-document): ΣID=3.657, ΣMT≈599ms
- **Change confidence threshold and save** (change-confidence-save): ΣID=2.924, ΣMT≈489ms
- **Save Erkannte Felder via SaveBar** (recognized-fields-save-bar): ΣID=2.924, ΣMT≈489ms

## Fitts movement breakdown (desktop, all tasks)

### Upload a document (`upload-document`)
1. pointer-origin → Hochladen: D=664px, W=120.1px, ID=2.707, boxes 719,449 2×2 → 1270,158 113×42
2. Hochladen → Dateien auswählen: D=1049px, W=1.0px, ID=10.014, boxes 1270,158 113×42 → 277,162 1×1

### Open a document from the library (`open-document`)
1. pointer-origin → Finanzplan Muster GmbH.pdf: D=375px, W=32.3px, ID=3.657, boxes 719,449 2×2 → 645,815 200×19

### Assign a label on document detail (`assign-label`)
1. pointer-origin → Labels1: D=446px, W=94.3px, ID=2.517, boxes 719,449 2×2 → 304,187 89×37
2. Labels1 → Label-Name für Zuweisung oder Neuanlage: D=410px, W=907.2px, ID=0.538, boxes 304,187 89×37 → 249,336 960×42
3. Label-Name für Zuweisung oder Neuanlage → Posteingang: D=440px, W=92.4px, ID=2.526, boxes 249,336 960×42 → 249,411 90×23

### Create a label in structure (`create-label`)
1. pointer-origin → primary-action: D=701px, W=128.9px, ID=2.686, boxes 719,449 2×2 → 1272,91 124×42
2. primary-action → : D=767px, W=741.2px, ID=1.025, boxes 1272,91 124×42 → 289,670 1082×40
3.  → Label anlegen: D=510px, W=141.7px, ID=2.200, boxes 289,670 1082×40 → 1235,858 136×42

### Create a recognized field (`create-recognized-field`)
1. pointer-origin → Feld hinzufügen: D=253px, W=156.0px, ID=1.390, boxes 719,449 2×2 → 892,379 151×42
2. Feld hinzufügen → : D=458px, W=227.9px, ID=1.590, boxes 892,379 151×42 → 465,121 249×40
3.  → Speichern: D=774px, W=86.0px, ID=3.321, boxes 465,121 249×40 → 883,811 108×42

### Change confidence threshold and save (`change-confidence-save`)
1. pointer-origin → primary-action: D=749px, W=113.6px, ID=2.924, boxes 719,449 2×2 → 1299,829 108×42

### Create folder and move a document (`folder-create-move`)
1. pointer-origin → Details: D=513px, W=76.8px, ID=2.941, boxes 719,449 2×2 → 236,187 68×37
2. Details → Ordner: D=683px, W=976.4px, ID=0.765, boxes 236,187 68×37 → 249,575 1162×40
3. Ordner → Metrik Ablage: D=87px, W=40.0px, ID=1.665, boxes 249,575 1162×40 → 254,661 1152×40
4. Metrik Ablage → primary-action: D=550px, W=115.6px, ID=2.525, boxes 254,661 1152×40 → 1299,829 108×42

### Global search (`search`)
1. pointer-origin → Suchen⌘K: D=425px, W=92.0px, ID=2.489, boxes 719,449 2×2 → 500,13 280×40

### Switch theme (`switch-theme`)
1. pointer-origin → Benutzermenü: D=800px, W=57.7px, ID=3.893, boxes 719,449 2×2 → 1382,12 42×42
2. Benutzermenü → Dunkel: D=193px, W=73.5px, ID=1.860, boxes 1382,12 42×42 → 1271,175 66×46

### Change a setting and save (`change-setting-save`)
1. pointer-origin → : D=263px, W=48.2px, ID=2.692, boxes 719,449 2×2 → 952,372 44×22

### Save Erkannte Felder via SaveBar (`recognized-fields-save-bar`)
1. pointer-origin → primary-action: D=749px, W=113.6px, ID=2.924, boxes 719,449 2×2 → 1299,829 108×42

### Open global search palette and pick a result (`search-palette-open-result`)
1. pointer-origin → search-palette: D=117px, W=474.2px, ID=0.318, boxes 719,449 2×2 → 400,96 640×474
2. search-palette → search-recent-document: D=219px, W=187.0px, ID=1.119, boxes 400,96 640×474 → 417,392 190×21

### Change document title and save (`document-title-save`)
1. pointer-origin → Details: D=513px, W=76.8px, ID=2.941, boxes 719,449 2×2 → 236,187 68×37
2. Details → : D=569px, W=1150.3px, ID=0.580, boxes 236,187 68×37 → 249,287 1162×40
3.  → primary-action: D=754px, W=105.1px, ID=3.032, boxes 249,287 1162×40 → 1299,829 108×42

## Top KLM-GOMS tasks (predicted)

Operator times: Card, S. K., Moran, T. P., & Newell, A. (1983). The Psychology of Human-Computer Interaction. Lawrence Erlbaum Associates.

- **Create folder and move a document**: 6.95s · 4 clicks · 2 keys · 2 switches
- **Create a recognized field**: 6.15s · 3 clicks · 4 keys · 2 switches
- **Change confidence threshold and save**: 6.15s · 4 clicks · 0 keys · 0 switches
- **Save Erkannte Felder via SaveBar**: 5.75s · 3 clicks · 2 keys · 2 switches
- **Create a label in structure**: 4.95s · 2 clicks · 4 keys · 2 switches
- **Change a setting and save**: 4.95s · 3 clicks · 0 keys · 0 switches
- **Upload a document**: 4.75s · 2 clicks · 3 keys · 2 switches
- **Assign a label on document detail**: 4.75s · 2 clicks · 3 keys · 2 switches
- **Change document title and save**: 4.75s · 2 clicks · 3 keys · 2 switches
- **Open global search palette and pick a result**: 4.35s · 2 clicks · 1 keys · 1 switches

## Layout consistency (customer pages only)

### Missing landmarks (not counted as px drift)

- `/documents` (Dokumente): missing primaryAction
- `/structure/recognized-fields` (Erkannte Felder): missing primaryAction
- `/settings` (Einstellungen): missing primaryAction
- `/settings/blocked-labels` (Einstellungen · Blockierte Labels): missing primaryAction
- `/settings/connectors` (Einstellungen · Verbindungen): missing primaryAction
- `/docs/styles` (Dev · Styles): missing pageTitle, primaryAction

- `/documents/bec327bf-259c-415f-9b7e-63745dc26851` **containerMaxWidth**: 1600px (median 1180px, Δ=420.0px)
- `/filesystem` **primaryActionX**: 917px (median 1204px, Δ=287.0px)
- `/settings/blocked-labels` **titleY**: 222px (median 104px, Δ=118.0px)
- `/settings/connectors` **titleY**: 222px (median 104px, Δ=118.0px)
- `/structure/labels` **primaryActionX**: 1272px (median 1204px, Δ=68.0px)
- `/filesystem` **containerMaxWidth**: 1220px (median 1180px, Δ=40.0px)
- `/documents/bec327bf-259c-415f-9b7e-63745dc26851` **primaryActionY**: 125px (median 92px, Δ=33.0px)
- `/documents/bec327bf-259c-415f-9b7e-63745dc26851` **titleY**: 132px (median 104px, Δ=28.0px)
- `/filesystem` **containerLeft**: 220px (median 240px, Δ=20.0px)
- `/documents/bec327bf-259c-415f-9b7e-63745dc26851` **containerLeft**: 220px (median 240px, Δ=20.0px)
- `/documents` **titleY**: 91px (median 104px, Δ=13.0px)
- `/structure/labels` **titleY**: 91px (median 104px, Δ=13.0px)
- `/structure/recognized-fields` **titleY**: 91px (median 104px, Δ=13.0px)
- `/filesystem` **titleY**: 117px (median 104px, Δ=13.0px)
- `/settings` **titleY**: 91px (median 104px, Δ=13.0px)
- `/filesystem` **containerPaddingTop**: 12px (median 24px, Δ=12.0px)
- `/documents/bec327bf-259c-415f-9b7e-63745dc26851` **containerPaddingTop**: 12px (median 24px, Δ=12.0px)
- `/documents/bec327bf-259c-415f-9b7e-63745dc26851` **titleFontSizePx**: 16px (median 22px, Δ=6.0px)
- `/settings/blocked-labels` **titleFontSizePx**: 18px (median 22px, Δ=4.0px)
- `/settings/connectors` **titleFontSizePx**: 18px (median 22px, Δ=4.0px)

## Dev / design-system pages (informational, excluded from customer variance)

- `/docs/styles`: containerLeft=220, maxWidth=1220, titleY=null

## Target sizes (WCAG 2.5.8 failures)

- Desktop summary: 61 failures / 188 controls
- Mobile summary: 44 failures / 168 controls

### desktop
- `/documents` `button` (button) "Navigation einklappen" · 22×28px
- `/documents` `input` (input) "Alle auswählen" · 13×13px
- `/documents` `button` (button) "Titel" · 31×20px
- `/documents` `button` (button) "Datum" · 46×20px
- `/documents` `input` (input) "Metrik Titel 237 auswählen" · 13×13px
- `/documents` `a` (a) "Metrik Titel 237" · 108×19px
- `/documents` `button` (button) "Aktionen für Metrik Titel 237" · 26×18px
- `/documents` `input` (input) "metrics-sample.pdf auswählen" · 13×13px
- `/documents` `a` (a) "metrics-sample.pdf" · 134×19px
- `/documents` `button` (button) "Aktionen für metrics-sample.pdf" · 26×18px
- `/documents` `input` (input) "Mietvertrag Garage.pdf auswählen" · 13×13px
- `/documents` `a` (a) "Mietvertrag Garage.pdf" · 158×19px
- `/documents` `button` (button) "Aktionen für Mietvertrag Garage.pdf" · 26×18px
- `/documents` `input` (input) "Mietvertrag Wohnung Musterstraße.pdf auswählen" · 13×13px
- `/documents` `a` (a) "Mietvertrag Wohnung Musterstraße.pdf" · 269×19px
- `/documents` `button` (button) "Aktionen für Mietvertrag Wohnung Musterstraße.pdf" · 26×18px
- `/documents` `input` (input) "Lohnsteuerbescheinigung 2024.pdf auswählen" · 13×13px
- `/documents` `a` (a) "Lohnsteuerbescheinigung 2024.pdf" · 242×19px
- `/documents` `button` (button) "Aktionen für Lohnsteuerbescheinigung 2024.pdf" · 26×18px
- `/documents` `input` (input) "Kontoauszug März 2024.pdf auswählen" · 13×13px
- `/documents` `a` (a) "Kontoauszug März 2024.pdf" · 191×19px
- `/documents` `button` (button) "Aktionen für Kontoauszug März 2024.pdf" · 26×18px
- `/documents` `input` (input) "Posteingang Scan.pdf auswählen" · 13×13px
- `/documents` `a` (a) "Posteingang Scan.pdf" · 148×19px
- `/documents` `button` (button) "Aktionen für Posteingang Scan.pdf" · 26×18px
- `/documents` `input` (input) "Steuerbescheid Muster 2023.pdf auswählen" · 13×13px
- `/documents` `a` (a) "Steuerbescheid Muster 2023.pdf" · 224×19px
- `/documents` `button` (button) "Aktionen für Steuerbescheid Muster 2023.pdf" · 26×18px
- `/structure/labels` `button` (button) "Navigation einklappen" · 22×28px
- `/structure/labels` `a` (a) "5 ohne Label anzeigen" · 175×23px
- `/structure/labels` `summary` (summary) "Wie wird das berechnet?" · 167×20px
- `/structure/labels` `a` (a) "Mietvertrag Garage" · 410×21px
- `/structure/labels` `a` (a) "Lohnsteuerbescheinigung 2024" · 413×21px
- `/structure/labels` `a` (a) "Kontoauszug März 2024" · 419×21px
- `/structure/labels` `a` (a) "1 Dokument" · 81×19px
- `/structure/labels` `a` (a) "1 Dokument" · 81×19px
- `/structure/labels` `a` (a) "1 Dokument" · 81×19px
- `/structure/labels` `a` (a) "1 Dokument" · 81×19px
- `/structure/recognized-fields` `button` (button) "Navigation einklappen" · 22×28px
- `/structure/recognized-fields` `a` (a) "Labels" · 40×18px
- `/structure/recognized-fields` `input` (input) "Finanzen" · 13×13px
- `/structure/recognized-fields` `input` (input) "Metrik Label 23184" · 13×13px
- `/structure/recognized-fields` `input` (input) "Metrik Label 49763" · 13×13px
- `/structure/recognized-fields` `input` (input) "Steuern" · 13×13px
- `/structure/recognized-fields` `input` (input) "Vertrag" · 13×13px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `button` (button) "Navigation einklappen" · 22×28px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `button` (button) "Unterordner einklappen" · 20×20px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `button` (button) "Unterordner in Metrik Ablage anlegen" · 22×22px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `button` (button) "Aktionen für Metrik Ablage" · 22×22px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `a` (a) "Ordner" · 44×18px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `a` (a) "Metrik Mappe" · 86×18px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `input#:r9:` (input) "Dateien auswählen" · 1×1px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `input` (input) "Alle auswählen" · 13×13px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `button` (button) "Titel" · 31×20px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `button` (button) "Datum" · 46×20px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `input` (input) "Metrik Titel 237 auswählen" · 13×13px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `a` (a) "Metrik Titel 237" · 108×19px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `button` (button) "Aktionen für Metrik Titel 237" · 26×18px
- `/settings` `button` (button) "Navigation einklappen" · 22×28px
- `/settings` `input#:r3:` (switch) "Erweiterte Funktionen aktivieren" · 44×22px
- `/settings/blocked-labels` `button` (button) "Navigation einklappen" · 22×28px

### mobile
- `/documents` `button` (button) "Navigation einklappen" · 22×28px
- `/documents` `input` (input) "Alle auswählen" · 13×13px
- `/documents` `input` (input) "Metrik Titel 237 auswählen" · 33×13px
- `/documents` `a` (a) "Metrik Titel 237" · 117×22px
- `/documents` `input` (input) "metrics-sample.pdf auswählen" · 33×13px
- `/documents` `a` (a) "metrics-sample.pdf" · 146×22px
- `/documents` `input` (input) "Mietvertrag Garage.pdf auswählen" · 33×13px
- `/documents` `a` (a) "Mietvertrag Garage.pdf" · 172×22px
- `/documents` `input` (input) "Mietvertrag Wohnung Musterstraße.pdf auswählen" · 33×13px
- `/documents` `a` (a) "Mietvertrag Wohnung Musterstraße.pdf" · 293×22px
- `/documents` `input` (input) "Lohnsteuerbescheinigung 2024.pdf auswählen" · 33×13px
- `/documents` `a` (a) "Lohnsteuerbescheinigung 2024.pdf" · 263×22px
- `/documents` `input` (input) "Kontoauszug März 2024.pdf auswählen" · 33×13px
- `/documents` `a` (a) "Kontoauszug März 2024.pdf" · 208×22px
- `/documents` `input` (input) "Posteingang Scan.pdf auswählen" · 33×13px
- `/documents` `a` (a) "Posteingang Scan.pdf" · 161×22px
- `/documents` `input` (input) "Steuerbescheid Muster 2023.pdf auswählen" · 33×13px
- `/documents` `a` (a) "Steuerbescheid Muster 2023.pdf" · 243×22px
- `/structure/labels` `button` (button) "Navigation einklappen" · 22×28px
- `/structure/labels` `a` (a) "5 ohne Label anzeigen" · 175×23px
- `/structure/labels` `summary` (summary) "Wie wird das berechnet?" · 167×20px
- `/structure/labels` `a` (a) "Mietvertrag Garage" · 266×21px
- `/structure/labels` `a` (a) "Lohnsteuerbescheinigung 2024" · 266×21px
- `/structure/labels` `a` (a) "Kontoauszug März 2024" · 266×21px
- `/structure/recognized-fields` `button` (button) "Navigation einklappen" · 22×28px
- `/structure/recognized-fields` `a` (a) "Labels" · 40×18px
- `/structure/recognized-fields` `input` (input) "Finanzen" · 13×13px
- `/structure/recognized-fields` `input` (input) "Metrik Label 23184" · 13×13px
- `/structure/recognized-fields` `input` (input) "Metrik Label 49763" · 13×13px
- `/structure/recognized-fields` `input` (input) "Steuern" · 13×13px
- `/structure/recognized-fields` `input` (input) "Vertrag" · 13×13px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `button` (button) "Navigation einklappen" · 22×28px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `button` (button) "Unterordner einklappen" · 20×20px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `button` (button) "Unterordner in Metrik Ablage anlegen" · 22×22px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `button` (button) "Aktionen für Metrik Ablage" · 22×22px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `a` (a) "Ordner" · 44×18px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `a` (a) "Metrik Mappe" · 86×18px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `input#:r9:` (input) "Dateien auswählen" · 1×1px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `input` (input) "Alle auswählen" · 13×13px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `input` (input) "Metrik Titel 237 auswählen" · 33×13px
- `/filesystem/folders/b85bddf8-c98d-4e71-8d72-e54fe7f3c100` `a` (a) "Metrik Titel 237" · 117×22px
- `/settings` `button` (button) "Navigation einklappen" · 22×28px
- `/settings` `input#:r3:` (switch) "Erweiterte Funktionen aktivieren" · 44×22px
- `/settings/blocked-labels` `button` (button) "Navigation einklappen" · 22×28px

## Stability & accessibility

- Nested scroll containers: 1
- CLS `open-account-menu`: 0.0000
- CLS `select-document-row`: 0.0000
- CLS `recognized-fields-dirty`: 0.0000
- CLS `save-bar-appears`: 0.0000
- CLS `search-palette-opens`: 0.0000
- axe violations (node count): 11

### axe details
- `color-contrast` (serious) on `/documents`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: span[title="Finanzen"] > .chip-label
- `color-contrast` (serious) on `/documents`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: span[title="Vertrag"] > .chip-label
- `color-contrast` (serious) on `/documents`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: span[title="Steuern"] > .chip-label
- `color-contrast` (serious) on `/structure/labels`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .labels-todo-suggestion.muted > .chip.chip-assigned[title="Vertrag"] > .chip-label
- `color-contrast` (serious) on `/structure/labels`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .labels-todo-suggestion.muted > .chip.chip-assigned[title="Steuern"] > .chip-label
- `color-contrast` (serious) on `/structure/labels`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .labels-todo-suggestion.muted > .chip.chip-assigned[title="Finanzen"] > .chip-label
- `color-contrast` (serious) on `/structure/labels`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: td:nth-child(1) > .chip.chip-assigned[title="Finanzen"] > .chip-label
- `color-contrast` (serious) on `/structure/labels`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: td:nth-child(1) > .chip.chip-assigned[title="Steuern"] > .chip-label
- `link-in-text-block` (serious) on `/structure/recognized-fields`: Ensure links are distinguished from surrounding text in a way that does not rely on color · nodes: .recognized-fields-labels-link > a[href$="labels"]
- `aria-required-attr` (critical) on `/filesystem`: Ensure elements with ARIA roles have all required ARIA attributes · nodes: .dateisystem-split-handle
- `color-contrast` (serious) on `/filesystem`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: span[title="Finanzen"] > .chip-label
- Lighthouse: Lighthouse skipped in local harness (offline/no Chrome DevTools Protocol audit in this runner).

## Hick-Hyman (informational choice counts)

- Primary sidebar navigation: 5 visible choices
- Top bar (search, locale, account): 4 visible choices
- Page header toolbar: 4 visible choices
