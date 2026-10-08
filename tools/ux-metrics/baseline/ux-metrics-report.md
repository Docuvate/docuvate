# Docuvate UX metrics report

Generated: 2026-10-08T11:32:35.378Z
Git SHA: e955edef2f57ee5fcee306fdef1c1fe03a1208b8
Web base: http://localhost:5173
Seed user: katalog.metrik@lokal.invalid

## Skipped tasks (optional product UI not present)

- `search-palette-open-result` — harness soft-skipped (no matching `data-ux` landmark)

## Top Fitts tasks (model estimate, desktop viewport)

Movement time uses MT = 50 + 150 × ID (ms). Source: MacKenzie, I. S. (1992). Fitts' law as a research and design tool in human-computer interaction. Human-Computer Interaction, 7(1), 91–139.

- **Upload a document** (upload-document): ΣID=12.730, ΣMT≈2010ms
- **Create folder and move a document** (folder-create-move): ΣID=7.913, ΣMT≈1387ms
- **Create a label in structure** (create-label): ΣID=7.568, ΣMT≈1285ms
- **Change document title and save** (document-title-save): ΣID=6.569, ΣMT≈1135ms
- **Create a recognized field** (create-recognized-field): ΣID=6.218, ΣMT≈1083ms
- **Assign a label on document detail** (assign-label): ΣID=5.582, ΣMT≈987ms
- **Switch theme** (switch-theme): ΣID=5.226, ΣMT≈884ms
- **Global search** (search): ΣID=4.014, ΣMT≈702ms
- **Open a document from the library** (open-document): ΣID=3.564, ΣMT≈585ms
- **Change confidence threshold and save** (change-confidence-save): ΣID=2.933, ΣMT≈490ms

## Fitts movement breakdown (desktop, all tasks)

### Upload a document (`upload-document`)
1. pointer-origin → Hochladen: D=665px, W=119.4px, ID=2.715, boxes 719,449 2×2 → 1271,158 112×42
2. Hochladen → Dateien auswählen: D=1050px, W=1.0px, ID=10.015, boxes 1271,158 112×42 → 277,162 1×1

### Open a document from the library (`open-document`)
1. pointer-origin → Finanzplan Muster GmbH.pdf: D=399px, W=36.8px, ID=3.564, boxes 719,449 2×2 → 653,838 204×19

### Assign a label on document detail (`assign-label`)
1. pointer-origin → Labels1: D=446px, W=94.4px, ID=2.517, boxes 719,449 2×2 → 303,187 89×37
2. Labels1 → Label-Name für Zuweisung oder Neuanlage: D=411px, W=907.3px, ID=0.539, boxes 303,187 89×37 → 249,336 960×42
3. Label-Name für Zuweisung oder Neuanlage → Posteingang: D=440px, W=92.4px, ID=2.526, boxes 249,336 960×42 → 249,411 90×23

### Create a label in structure (`create-label`)
1. pointer-origin → primary-action: D=701px, W=128.9px, ID=2.687, boxes 719,449 2×2 → 1272,91 124×42
2. primary-action → : D=767px, W=741.2px, ID=1.025, boxes 1272,91 124×42 → 289,670 1082×40
3.  → Suchen: D=659px, W=48.9px, ID=3.856, boxes 289,670 1082×40 → 838,12 88×42

### Create a recognized field (`create-recognized-field`)
1. pointer-origin → Feld hinzufügen: D=253px, W=155.3px, ID=1.394, boxes 719,449 2×2 → 893,379 150×42
2. Feld hinzufügen → : D=450px, W=230.7px, ID=1.562, boxes 893,379 150×42 → 465,136 249×40
3.  → Speichern: D=747px, W=87.0px, ID=3.262, boxes 465,136 249×40 → 884,797 107×42

### Change confidence threshold and save (`change-confidence-save`)
1. pointer-origin → primary-action: D=749px, W=112.9px, ID=2.933, boxes 719,449 2×2 → 1300,829 107×42

### Create folder and move a document (`folder-create-move`)
1. pointer-origin → Details: D=513px, W=76.3px, ID=2.949, boxes 719,449 2×2 → 236,187 67×37
2. Details → Ordner: D=683px, W=976.5px, ID=0.765, boxes 236,187 67×37 → 249,575 1162×40
3. Ordner → Metrik Ablage: D=87px, W=40.0px, ID=1.665, boxes 249,575 1162×40 → 254,661 1152×40
4. Metrik Ablage → primary-action: D=550px, W=114.7px, ID=2.535, boxes 254,661 1152×40 → 1300,829 107×42

### Global search (`search`)
1. pointer-origin → Globale Suche: D=429px, W=141.3px, ID=2.014, boxes 719,449 2×2 → 406,12 424×42
2. Globale Suche → Suchen: D=264px, W=88.0px, ID=2.000, boxes 406,12 424×42 → 838,12 88×42

### Switch theme (`switch-theme`)
1. pointer-origin → Benutzermenü: D=802px, W=52.2px, ID=4.032, boxes 719,449 2×2 → 1386,14 38×38
2. Benutzermenü → Dunkles Design: D=193px, W=150.1px, ID=1.194, boxes 1386,14 38×38 → 1193,178 222×40

### Change a setting and save (`change-setting-save`)
1. pointer-origin → : D=263px, W=48.2px, ID=2.692, boxes 719,449 2×2 → 952,372 44×22

### Save Erkannte Felder via SaveBar (`recognized-fields-save-bar`)
1. pointer-origin → primary-action: D=749px, W=112.9px, ID=2.933, boxes 719,449 2×2 → 1300,829 107×42

### Change document title and save (`document-title-save`)
1. pointer-origin → Details: D=513px, W=76.3px, ID=2.949, boxes 719,449 2×2 → 236,187 67×37
2. Details → : D=570px, W=1150.4px, ID=0.580, boxes 236,187 67×37 → 249,287 1162×40
3.  → primary-action: D=755px, W=104.5px, ID=3.039, boxes 249,287 1162×40 → 1300,829 107×42

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
- **Open a document from the library**: 3.75s · 2 clicks · 0 keys · 0 switches

## Layout consistency (customer pages only)

### Missing landmarks (not counted as px drift)

- `/documents` (Dokumente): missing primaryAction
- `/structure/recognized-fields` (Erkannte Felder): missing primaryAction
- `/settings` (Einstellungen): missing primaryAction
- `/settings/blocked-labels` (Einstellungen · Blockierte Labels): missing primaryAction
- `/settings/connectors` (Einstellungen · Verbindungen): missing primaryAction
- `/docs/styles` (Dev · Styles): missing pageTitle, primaryAction

- `/documents/c7d25244-3635-4153-b085-2d6be59f883b` **containerMaxWidth**: 1600px (median 1180px, Δ=420.0px)
- `/filesystem` **primaryActionX**: 920px (median 1202px, Δ=282.0px)
- `/settings/blocked-labels` **titleY**: 222px (median 104px, Δ=118.0px)
- `/settings/connectors` **titleY**: 222px (median 104px, Δ=118.0px)
- `/structure/labels` **primaryActionX**: 1272px (median 1202px, Δ=70.0px)
- `/filesystem` **containerMaxWidth**: 1220px (median 1180px, Δ=40.0px)
- `/documents/c7d25244-3635-4153-b085-2d6be59f883b` **primaryActionY**: 125px (median 92px, Δ=33.0px)
- `/documents/c7d25244-3635-4153-b085-2d6be59f883b` **titleY**: 132px (median 104px, Δ=28.0px)
- `/filesystem` **containerLeft**: 220px (median 240px, Δ=20.0px)
- `/documents/c7d25244-3635-4153-b085-2d6be59f883b` **containerLeft**: 220px (median 240px, Δ=20.0px)
- `/documents` **titleY**: 91px (median 104px, Δ=13.0px)
- `/structure/labels` **titleY**: 91px (median 104px, Δ=13.0px)
- `/structure/recognized-fields` **titleY**: 91px (median 104px, Δ=13.0px)
- `/filesystem` **titleY**: 117px (median 104px, Δ=13.0px)
- `/settings` **titleY**: 91px (median 104px, Δ=13.0px)
- `/filesystem` **containerPaddingTop**: 12px (median 24px, Δ=12.0px)
- `/documents/c7d25244-3635-4153-b085-2d6be59f883b` **containerPaddingTop**: 12px (median 24px, Δ=12.0px)
- `/documents/c7d25244-3635-4153-b085-2d6be59f883b` **titleFontSizePx**: 16px (median 22px, Δ=6.0px)
- `/settings/blocked-labels` **titleFontSizePx**: 18px (median 22px, Δ=4.0px)
- `/settings/connectors` **titleFontSizePx**: 18px (median 22px, Δ=4.0px)

## Dev / design-system pages (informational, excluded from customer variance)

- `/docs/styles`: containerLeft=220, maxWidth=1220, titleY=null

## Target sizes (WCAG 2.5.8 failures)

- Desktop summary: 67 failures / 185 controls
- Mobile summary: 62 failures / 175 controls

### desktop
- `/documents` `button` (button) "Navigation einklappen" · 22×28px
- `/documents` `input` (input) "Alle auswählen" · 13×13px
- `/documents` `button` (button) "Titel" · 31×20px
- `/documents` `button` (button) "Datum" · 46×20px
- `/documents` `input` (input) "Metrik Titel 674 auswählen" · 13×13px
- `/documents` `a` (a) "Metrik Titel 674" · 110×19px
- `/documents` `a` (a) "Öffnen" · 44×21px
- `/documents` `button` (button) "Aktionen für Metrik Titel 674" · 26×18px
- `/documents` `input` (input) "metrics-sample.pdf auswählen" · 13×13px
- `/documents` `a` (a) "metrics-sample.pdf" · 134×19px
- `/documents` `a` (a) "Öffnen" · 44×21px
- `/documents` `button` (button) "Aktionen für metrics-sample.pdf" · 26×18px
- `/documents` `input` (input) "Mietvertrag Garage.pdf auswählen" · 13×13px
- `/documents` `a` (a) "Mietvertrag Garage.pdf" · 160×19px
- `/documents` `a` (a) "Öffnen" · 44×21px
- `/documents` `button` (button) "Aktionen für Mietvertrag Garage.pdf" · 26×18px
- `/documents` `input` (input) "Mietvertrag Wohnung Musterstraße.pdf auswählen" · 13×13px
- `/documents` `a` (a) "Mietvertrag Wohnung Musterstraße.pdf" · 274×19px
- `/documents` `a` (a) "Öffnen" · 44×21px
- `/documents` `button` (button) "Aktionen für Mietvertrag Wohnung Musterstraße.pdf" · 26×18px
- `/documents` `input` (input) "Lohnsteuerbescheinigung 2024.pdf auswählen" · 13×13px
- `/documents` `a` (a) "Lohnsteuerbescheinigung 2024.pdf" · 245×19px
- `/documents` `a` (a) "Öffnen" · 44×21px
- `/documents` `button` (button) "Aktionen für Lohnsteuerbescheinigung 2024.pdf" · 26×18px
- `/documents` `input` (input) "Kontoauszug März 2024.pdf auswählen" · 13×13px
- `/documents` `a` (a) "Kontoauszug März 2024.pdf" · 195×19px
- `/documents` `a` (a) "Öffnen" · 44×21px
- `/documents` `button` (button) "Aktionen für Kontoauszug März 2024.pdf" · 26×18px
- `/documents` `input` (input) "Posteingang Scan.pdf auswählen" · 13×13px
- `/documents` `a` (a) "Posteingang Scan.pdf" · 150×19px
- `/documents` `a` (a) "Öffnen" · 44×21px
- `/documents` `button` (button) "Aktionen für Posteingang Scan.pdf" · 26×18px
- `/documents` `input` (input) "Steuerbescheid Muster 2023.pdf auswählen" · 13×13px
- `/documents` `a` (a) "Steuerbescheid Muster 2023.pdf" · 227×19px
- `/documents` `a` (a) "Öffnen" · 44×21px
- `/documents` `button` (button) "Aktionen für Steuerbescheid Muster 2023.pdf" · 26×18px
- `/structure/labels` `button` (button) "Navigation einklappen" · 22×28px
- `/structure/labels` `a` (a) "5 ohne Label anzeigen" · 172×23px
- `/structure/labels` `summary` (summary) "Wie wird das berechnet?" · 169×20px
- `/structure/labels` `a` (a) "Mietvertrag Garage" · 412×21px
- `/structure/labels` `a` (a) "Kontoauszug März 2024" · 420×21px
- `/structure/labels` `a` (a) "Lohnsteuerbescheinigung 2024" · 429×21px
- `/structure/labels` `a` (a) "1 Dokument" · 78×19px
- `/structure/labels` `a` (a) "2 Dokumente" · 86×19px
- `/structure/labels` `a` (a) "1 Dokument" · 78×19px
- `/structure/recognized-fields` `button` (button) "Navigation einklappen" · 22×28px
- `/structure/recognized-fields` `a` (a) "Labels" · 41×18px
- `/structure/recognized-fields` `input` (input) "Finanzen" · 13×13px
- `/structure/recognized-fields` `input` (input) "Steuern" · 13×13px
- `/structure/recognized-fields` `input` (input) "Vertrag" · 13×13px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `button` (button) "Navigation einklappen" · 22×28px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `button` (button) "Unterordner einklappen" · 20×20px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `button` (button) "Unterordner in Metrik Ablage anlegen" · 22×22px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `button` (button) "Aktionen für Metrik Ablage" · 22×22px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `a` (a) "Ordner" · 44×18px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `a` (a) "Metrik Mappe" · 85×18px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `input#:r8:` (input) "Dateien auswählen" · 1×1px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `input` (input) "Alle auswählen" · 13×13px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `button` (button) "Titel" · 31×20px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `button` (button) "Datum" · 46×20px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `input` (input) "Metrik Titel 674 auswählen" · 13×13px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `a` (a) "Metrik Titel 674" · 110×19px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `a` (a) "Öffnen" · 44×21px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `button` (button) "Aktionen für Metrik Titel 674" · 26×18px
- `/settings` `button` (button) "Navigation einklappen" · 22×28px
- `/settings` `input#:r2:` (switch) "Erweiterte Funktionen aktivieren" · 44×22px
- `/settings/blocked-labels` `button` (button) "Navigation einklappen" · 22×28px

### mobile
- `/documents` `button` (button) "Navigation einklappen" · 22×28px
- `/documents` `input` (input) "Alle auswählen" · 13×13px
- `/documents` `button` (button) "Titel" · 31×20px
- `/documents` `input` (input) "Metrik Titel 674 auswählen" · 13×13px
- `/documents` `a` (a) "Metrik Titel 674" · 110×19px
- `/documents` `a` (a) "Öffnen" · 44×21px
- `/documents` `button` (button) "Aktionen für Metrik Titel 674" · 26×18px
- `/documents` `input` (input) "metrics-sample.pdf auswählen" · 13×13px
- `/documents` `a` (a) "metrics-sample.pdf" · 134×19px
- `/documents` `a` (a) "Öffnen" · 44×21px
- `/documents` `button` (button) "Aktionen für metrics-sample.pdf" · 26×18px
- `/documents` `input` (input) "Mietvertrag Garage.pdf auswählen" · 13×13px
- `/documents` `a` (a) "Mietvertrag Garage.pdf" · 160×19px
- `/documents` `a` (a) "Öffnen" · 44×21px
- `/documents` `button` (button) "Aktionen für Mietvertrag Garage.pdf" · 26×18px
- `/documents` `input` (input) "Mietvertrag Wohnung Musterstraße.pdf auswählen" · 13×13px
- `/documents` `a` (a) "Mietvertrag Wohnung Musterstraße.pdf" · 274×19px
- `/documents` `a` (a) "Öffnen" · 44×21px
- `/documents` `button` (button) "Aktionen für Mietvertrag Wohnung Musterstraße.pdf" · 26×18px
- `/documents` `input` (input) "Lohnsteuerbescheinigung 2024.pdf auswählen" · 13×13px
- `/documents` `a` (a) "Lohnsteuerbescheinigung 2024.pdf" · 245×19px
- `/documents` `a` (a) "Öffnen" · 44×21px
- `/documents` `button` (button) "Aktionen für Lohnsteuerbescheinigung 2024.pdf" · 26×18px
- `/documents` `input` (input) "Kontoauszug März 2024.pdf auswählen" · 13×13px
- `/documents` `a` (a) "Kontoauszug März 2024.pdf" · 195×19px
- `/documents` `a` (a) "Öffnen" · 44×21px
- `/documents` `button` (button) "Aktionen für Kontoauszug März 2024.pdf" · 26×18px
- `/documents` `input` (input) "Posteingang Scan.pdf auswählen" · 13×13px
- `/documents` `a` (a) "Posteingang Scan.pdf" · 150×19px
- `/documents` `a` (a) "Öffnen" · 44×21px
- `/documents` `button` (button) "Aktionen für Posteingang Scan.pdf" · 26×18px
- `/documents` `input` (input) "Steuerbescheid Muster 2023.pdf auswählen" · 13×13px
- `/documents` `a` (a) "Steuerbescheid Muster 2023.pdf" · 227×19px
- `/documents` `a` (a) "Öffnen" · 44×21px
- `/documents` `button` (button) "Aktionen für Steuerbescheid Muster 2023.pdf" · 26×18px
- `/structure/labels` `button` (button) "Navigation einklappen" · 22×28px
- `/structure/labels` `a` (a) "5 ohne Label anzeigen" · 172×23px
- `/structure/labels` `summary` (summary) "Wie wird das berechnet?" · 169×20px
- `/structure/labels` `a` (a) "Mietvertrag Garage" · 266×21px
- `/structure/labels` `a` (a) "Kontoauszug März 2024" · 266×21px
- `/structure/labels` `a` (a) "Lohnsteuerbescheinigung 2024" · 266×21px
- `/structure/recognized-fields` `button` (button) "Navigation einklappen" · 22×28px
- `/structure/recognized-fields` `a` (a) "Labels" · 41×18px
- `/structure/recognized-fields` `input` (input) "Finanzen" · 13×13px
- `/structure/recognized-fields` `input` (input) "Steuern" · 13×13px
- `/structure/recognized-fields` `input` (input) "Vertrag" · 13×13px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `button` (button) "Navigation einklappen" · 22×28px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `button` (button) "Unterordner einklappen" · 20×20px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `button` (button) "Unterordner in Metrik Ablage anlegen" · 22×22px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `button` (button) "Aktionen für Metrik Ablage" · 22×22px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `a` (a) "Ordner" · 44×18px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `a` (a) "Metrik Mappe" · 85×18px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `input#:r8:` (input) "Dateien auswählen" · 1×1px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `input` (input) "Alle auswählen" · 13×13px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `button` (button) "Titel" · 31×20px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `input` (input) "Metrik Titel 674 auswählen" · 13×13px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `a` (a) "Metrik Titel 674" · 110×19px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `a` (a) "Öffnen" · 44×21px
- `/filesystem/folders/8c331332-71f4-4f9c-a5cc-cda4691eaa95` `button` (button) "Aktionen für Metrik Titel 674" · 26×18px
- `/settings` `button` (button) "Navigation einklappen" · 22×28px
- `/settings` `input#:r2:` (switch) "Erweiterte Funktionen aktivieren" · 44×22px
- `/settings/blocked-labels` `button` (button) "Navigation einklappen" · 22×28px

## Stability & accessibility

- Nested scroll containers: 1
- CLS `open-account-menu`: 0.0000
- CLS `select-document-row`: 0.0000
- CLS `recognized-fields-dirty`: 0.0000
- CLS `save-bar-appears`: 0.0000
- axe violations (node count): 48

### axe details
- `color-contrast` (serious) on `/documents`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: a[aria-current="page"] > .sidebar-link-label
- `color-contrast` (serious) on `/documents`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .view-switcher-btn-active
- `color-contrast` (serious) on `/documents`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .filter-mode-btn-active
- `color-contrast` (serious) on `/documents`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .library-title-labels-fallback > .document-labels-cell > .document-labels-cell-row > .chip.chip-assigned[title="Finanzen"] > .chip-label
- `color-contrast` (serious) on `/documents`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: tr:nth-child(1) > .library-col-title > .library-title-labels-fallback > .document-labels-cell > .document-labels-cell-row > .chip.chip-assigned[title="Steuern"] > .chip-label
- `color-contrast` (serious) on `/documents`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .library-col-labels > .document-labels-cell > .document-labels-cell-row > .chip.chip-assigned[title="Finanzen"] > .chip-label
- `color-contrast` (serious) on `/documents`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: tr:nth-child(1) > .library-col-labels > .document-labels-cell > .document-labels-cell-row > .chip.chip-assigned[title="Steuern"] > .chip-label
- `color-contrast` (serious) on `/documents`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .library-title-labels-fallback > .document-labels-cell > .document-labels-cell-row > .chip.chip-assigned[title="Vertrag"] > .chip-label
- `color-contrast` (serious) on `/documents`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .library-col-labels > .document-labels-cell > .document-labels-cell-row > .chip.chip-assigned[title="Vertrag"] > .chip-label
- `color-contrast` (serious) on `/documents`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: tr:nth-child(8) > .library-col-title > .library-title-labels-fallback > .document-labels-cell > .document-labels-cell-row > .chip.chip-assigned[title="Steuern"] > .chip-label
- `color-contrast` (serious) on `/documents`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: tr:nth-child(8) > .library-col-labels > .document-labels-cell > .document-labels-cell-row > .chip.chip-assigned[title="Steuern"] > .chip-label
- `color-contrast` (serious) on `/structure/labels`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: a[aria-current="page"] > .sidebar-link-label
- `color-contrast` (serious) on `/structure/labels`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .btn-primary
- `color-contrast` (serious) on `/structure/labels`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .labels-coverage-filter-link
- `color-contrast` (serious) on `/structure/labels`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: summary
- `color-contrast` (serious) on `/structure/labels`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .labels-todo-suggestion.muted > .chip.chip-assigned[title="Vertrag"] > .chip-label
- `color-contrast` (serious) on `/structure/labels`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .labels-todo-suggestion.muted > .chip.chip-assigned[title="Finanzen"] > .chip-label
- `color-contrast` (serious) on `/structure/labels`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .labels-todo-suggestion.muted > .chip.chip-assigned[title="Steuern"] > .chip-label
- `color-contrast` (serious) on `/structure/labels`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: td:nth-child(1) > .chip.chip-assigned[title="Finanzen"] > .chip-label
- `color-contrast` (serious) on `/structure/labels`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: tr:nth-child(1) > td:nth-child(2) > .labels-vocabulary-doc-link
- `color-contrast` (serious) on `/structure/labels`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: td:nth-child(1) > .chip.chip-assigned[title="Steuern"] > .chip-label
- `color-contrast` (serious) on `/structure/labels`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: tr:nth-child(2) > td:nth-child(2) > .labels-vocabulary-doc-link
- `color-contrast` (serious) on `/structure/labels`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: td:nth-child(1) > .chip.chip-assigned[title="Vertrag"] > .chip-label
- `color-contrast` (serious) on `/structure/labels`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: tr:nth-child(3) > td:nth-child(2) > .labels-vocabulary-doc-link
- `color-contrast` (serious) on `/structure/recognized-fields`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: a[aria-current="page"] > .sidebar-link-label
- `color-contrast` (serious) on `/structure/recognized-fields`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .recognized-fields-labels-link > a[href$="labels"]
- `color-contrast` (serious) on `/structure/recognized-fields`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .settings-field:nth-child(1) > .confidence-threshold-slider > .confidence-threshold-slider__scale[aria-hidden="true"] > .confidence-threshold-slider__ticks > .confidence-threshold-slider__tick:nth-child(1)
- `color-contrast` (serious) on `/structure/recognized-fields`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .settings-field:nth-child(1) > .confidence-threshold-slider > .confidence-threshold-slider__scale[aria-hidden="true"] > .confidence-threshold-slider__ticks > .confidence-threshold-slider__tick--mid.confidence-threshold-slider__tick:nth-child(2)
- `color-contrast` (serious) on `/structure/recognized-fields`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .settings-field:nth-child(1) > .confidence-threshold-slider > .confidence-threshold-slider__scale[aria-hidden="true"] > .confidence-threshold-slider__ticks > .confidence-threshold-slider__tick--mid.confidence-threshold-slider__tick:nth-child(3)
- `color-contrast` (serious) on `/structure/recognized-fields`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .settings-field:nth-child(1) > .confidence-threshold-slider > .confidence-threshold-slider__scale[aria-hidden="true"] > .confidence-threshold-slider__ticks > .confidence-threshold-slider__tick--mid.confidence-threshold-slider__tick:nth-child(4)
- `color-contrast` (serious) on `/structure/recognized-fields`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .settings-field:nth-child(1) > .confidence-threshold-slider > .confidence-threshold-slider__scale[aria-hidden="true"] > .confidence-threshold-slider__ticks > .confidence-threshold-slider__tick:nth-child(5)
- `link-in-text-block` (serious) on `/structure/recognized-fields`: Ensure links are distinguished from surrounding text in a way that does not rely on color · nodes: .recognized-fields-labels-link > a[href$="labels"]
- `aria-required-attr` (critical) on `/filesystem`: Ensure elements with ARIA roles have all required ARIA attributes · nodes: .dateisystem-split-handle
- `color-contrast` (serious) on `/filesystem`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .active[aria-current="page"][href$="filesystem"] > .sidebar-link-label
- `color-contrast` (serious) on `/filesystem`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: a[title="Metrik Ablage"] > .sidebar-tree-name
- `color-contrast` (serious) on `/filesystem`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: li:nth-child(1) > a[href$="filesystem"]
- `color-contrast` (serious) on `/filesystem`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: li:nth-child(2) > a
- `color-contrast` (serious) on `/filesystem`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .btn-primary
- `color-contrast` (serious) on `/filesystem`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .view-switcher-btn-active
- `color-contrast` (serious) on `/filesystem`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .library-title-labels-fallback > .document-labels-cell > .document-labels-cell-row > .chip.chip-assigned[title="Finanzen"] > .chip-label
- `color-contrast` (serious) on `/filesystem`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .library-title-labels-fallback > .document-labels-cell > .document-labels-cell-row > .chip.chip-assigned[title="Steuern"] > .chip-label
- `color-contrast` (serious) on `/filesystem`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .library-col-labels > .document-labels-cell > .document-labels-cell-row > .chip.chip-assigned[title="Finanzen"] > .chip-label
- `color-contrast` (serious) on `/filesystem`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .library-col-labels > .document-labels-cell > .document-labels-cell-row > .chip.chip-assigned[title="Steuern"] > .chip-label
- `color-contrast` (serious) on `/filesystem`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .library-row-actions > a
- `color-contrast` (serious) on `/settings`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .active[aria-current="page"][href$="settings"] > .sidebar-link-label
- `color-contrast` (serious) on `/settings`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .settings-section-tab--active
- `color-contrast` (serious) on `/settings/blocked-labels`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .active[aria-current="page"][href$="settings"] > .sidebar-link-label
- `color-contrast` (serious) on `/settings/blocked-labels`: Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds · nodes: .settings-section-tab--active
- Lighthouse: Lighthouse skipped in local harness (offline/no Chrome DevTools Protocol audit in this runner).

## Hick-Hyman (informational choice counts)

- Primary sidebar navigation: 5 visible choices
- Top bar (search, locale, account): 5 visible choices
- Page header toolbar: 4 visible choices
