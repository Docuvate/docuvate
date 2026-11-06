<!-- SPDX-FileCopyrightText: 2026 Thomas Faust -->
<!-- SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0 -->
# Structuring editor: concept and implementation plan

Status: proposal plus first slice (PR #117). The goal is expert throughput: turning one document into
correct structured data in as few decisions as possible. This is not a general-purpose drawing tool.

## 1. What we learned from existing editors

| Source | What works | What we take | What we leave out |
|---|---|---|---|
| Label Studio (Document AI template) | Tool rail with single-key tools (V select, H pan, B box, T text span, R table). Labels on 1-9. Table editor with draggable row/column dividers and merged cells. Coordinates are page-relative. | Single-key tools, number keys for the active role, row/column dividers as the table model, page-relative coordinates | A generic label config. Our roles are fixed and typed. |
| Label Studio OCR workflow (community) | Fastest loop: select a region, mark it checked or "fix required", Enter edits the text, Enter confirms | Review is triage: confirm with one key, edit only exceptions | Separate "fix required" labels. Confidence already sorts the work. |
| CVAT | Autosave setting, configurable shortcuts, "attribute annotation mode" (zoom to one object, then cycle through its attributes) | Focus mode: zoom to the active region and Tab through its values | 15-minute autosave intervals. We save each action. |
| Transkribus | Hold V/H to split a shape vertically or horizontally, C for a custom cut, M to merge. Tab follows reading order. Esc returns to select. Ctrl-click for multi-select. | Split, merge and Tab-in-reading-order semantics; Esc as the universal "back to select" | Baseline editing (handwriting-specific) |
| eScriptorium / PAGE XML | Typed polygon regions, nested regions (table cells), reading order as an ordered list of region references. Recommendation: fix reading order last, because geometry edits recompute it. | Reading order as an explicit, separate list. We recompute it only until a person has edited it. | PAGE XML as the internal model. It stays an export target. |

## 2. Laws of UX applied (only where they decide something)

| Law | Decision |
|---|---|
| Fitts's Law | Accept and correct sit on the value row, next to where the eye already is, not in a far toolbar. Handles are 8 px visible with a 24 px hit area. Primary actions in the workbench are full-width rows, not tiny icons only. |
| Hick's Law | One active tool at a time. A role palette of at most 9 roles bound to 1-9. Everything else goes behind "More". The table layout picker shows six table families first; the independent dimensions are one disclosure away. |
| Jakob's Law | Standard editor keys: V select, H or Space-drag pan, B box, P polygon, Esc select, Del delete, Cmd/Ctrl+Z / Shift+Z, Cmd/Ctrl-click to add to the selection, wheel+Ctrl to zoom. These match Figma, Label Studio and CVAT. |
| Doherty Threshold (<400 ms) | Optimistic UI: the row turns confirmed instantly and the save runs in the background with a visible state ("Saving…", "Saved", "Retry"). No spinner blocks the next keystroke. Overlays are computed client-side from tokens already loaded. |
| Tesler's Law | Coordinate math (page rotation, deskew, MediaBox) lives in `region-geometry.ts`, never in the user's head. Users draw in what they see; we store unrotated, normalized coordinates. |
| Postel's Law | Accept rough input: a loose box snaps to the tokens it covers, and pasted values are normalized (dates, amounts). Send strict data: normalized rect, explicit vertices, token indexes. |
| Goal-Gradient / Zeigarnik | The workbench shows "n open" with a progress bar. When everything is done, focus moves to "Next document" so Enter continues the loop. |
| Law of Common Region / Uniform Connectedness | The selected region on the PDF and its row in the workbench share the accent outline. A thin connector to the value appears on hover. |
| Miller's Law (cautiously) | We don't show more than about 7 shortcuts at once in the footer hint. The full list is behind `?`. |
| Paradox of the Active User | Shortcuts are shown inline (footer hint, `aria-keyshortcuts`, tooltips), not in a manual. |
| Peak-End Rule | The last moment of a document is a clear "All reviewed", then the next document. It is not a toast pile. |

## 3. Document state: structuring is the normal state

Docuvate is a durable repository, not a conversion step. The pipeline reads Upload → Recognize →
Structure → Records: once recognized and labelled, a document is a structured record that stays
searchable and can be refined at any time. There is no forced terminal stage and no "exported" state;
export (CSV, JSON, Typst) is a secondary action on records. Processing status (queued, reading,
failed) is technical and kept apart from the human work.

The UI does not promise versioning or GoBD retention yet, but nothing contradicts them: records are
never "finished and gone", corrections are edits to a record, and an immutable or versioned record
can later sit behind the same "Records" stage without changing the navigation.

To help people find what is left, the viewer shows one quiet strip with four aspects: Text, Labels,
Layout and Fields. Each says "n open", "nothing open" or "not processed" and jumps to the matching
correction place on click. It is navigation, not a workflow: no extra screens, no per-aspect sign-off.
Nothing counts as confirmed just because extraction ran; text is never reported as confirmed (we have
no evidence for it), and fields only count as confirmed when a person confirmed every value. The list
keeps its single status pill so rows stay scannable. An optional "done" marker is not built: it would
need a stored timestamp, and the per-aspect counts already answer "is anything left?".

## 4. Interaction model

### 4.1 Modes and tools (one active at a time)

| Mode | Key | Drag on page means | Notes |
|---|---|---|---|
| Review (default) | `R` | Pan | Workbench list is focused; ↑/↓ or J/K moves, Enter accepts, E edits, F moves to another field, N next document |
| Select | `V` / `Esc` | Marquee select | Click a region to select it, Cmd/Ctrl-click adds, Tab moves in reading order, Shift+Tab goes back |
| Box | `B` | Draw a rectangle | Snaps to the token hull when Snap is on (`S` toggles) |
| Polygon | `P` | Click to add vertices, Enter or double-click closes, Backspace removes the last vertex | For skewed or irregular regions |
| Text span | `T` | Select tokens in reading order | Can run across pages (see 4.3) |
| Table | `G` | Draw the table frame, then pick a layout | Opens the table layout picker (4.5) |
| Pan | `H` or hold Space | Pan | Wheel scrolls pages; Ctrl/Cmd+wheel or `+`/`-` zooms; `0` fits width; `1` shows 100 % |

After a region is drawn, the role palette applies `1-9` (heading, paragraph, list, table, figure, header, footer, field, ignore). The role defaults to the last one used (Postel: sensible defaults).

### 4.2 Coordinate system and rotation

* Storage is the unrotated MediaBox, normalized to 0…1 with the origin at top-left. This is already the convention in `region-geometry.ts` and `document_regions` (CHECK 0 ≤ x0 < x1 ≤ 1).
* Viewer space is the page as displayed after the PDF /Rotate plus user page rotation (90° steps) plus user deskew (small angle).
* Each draw event is converted once with `viewerPointToUnrotatedPage` (extended with deskew) before it enters state. Undo and redo operate on stored coordinates, so a later rotation never corrupts history.
* Page rotation and deskew are non-destructive page transforms (new table, see section 6). They never rewrite the source file. Re-OCR after rotation is an explicit, separate action because it enqueues a job.

### 4.3 Selection semantics, including multiple pages

* A region belongs to exactly one page. It's a physical object, as in PAGE XML.
* A logical element can span pages: a table continued on page 2, or a paragraph split by a page break. It is modelled as a **region group**: an ordered list of regions with one role and one meaning. That keeps every geometry row single-page and 3NF.
* Text span selection across pages creates one group with one region per page segment.
* Multi-select (Cmd/Ctrl-click or marquee) enables Merge (`M`, same page and same role) and Group (`Cmd/Ctrl+G`, across pages). Split is hold `\` with a horizontal or vertical guide, or `C` for a custom cut line.

### 4.4 Corrections are non-destructive and teach the model

* Every edit is a `correction` row (existing table) with `kind` and `op`. Superseded regions keep `superseded_by` (existing), and withdrawing a correction restores the previous state (existing endpoint `…/corrections/:id/withdraw`).
* Undo and redo are client-side command stacks of correction ids. Undo sends `withdraw`; redo re-applies the stored request. Each command has an idempotency id (the request `id` that the API already requires).
* Saving is per action (autosave), with a three-state indicator: Saving / Saved / Failed with retry. Conflicts are detected through `ir_sha256`: if the layout IR changed underneath, we show a "document was reprocessed" banner and rebase only geometry-free corrections.
* Training feedback: `extraction_field_confirmations` (existing) records confirmations, and corrections record before/after pairs. Batch propagation is opt-in per action ("apply to all documents with label X"), is shown as a preview count, and is itself a correction scope (`FieldCorrectionScope = 'label' | 'always'` already exists).

### 4.5 Tables

* The model already supports row/column rules, merges (`row_span`, `col_span`), cell texts and header rows/columns.
* Table layout picker (built): a "Layout" button on each recognised table opens six families (Simple table, Matrix, Multi-level header, Financial layout, Sections with subtotals, Key and value). A family only sets defaults. "Adjust structure" then exposes the independent dimensions: header rows (levels), index column (none, left, right, both), result rows (footer), lines (grid, accounting, horizontal, none, as detected), sections with subtotals, and zebra rows. Every combination is valid by construction, so there is no hard-coded list of combinations. The sketches are generated from the same `designTable` function whose result is saved, so a sketch cannot disagree with the result.
* The grid itself, meaning the row and column dividers, still comes from the recognised tokens, so picking a layout never moves dividers away from the text. Nested headers use rowspan stubs for the index and pairwise column groups; footer labels span all but the amount column.

#### 4.5.1 Table structure model (three independent dimensions)

| Dimension | Stored as (3NF) | Meaning |
| --- | --- | --- |
| Logical bands | `document_region_tables.header_rows`, `footer_rows`; `document_region_table_row_roles (region_id, row, role)` with role `section` or `subtotal` | More than one header row is a nested header (spans come from merges). Footer rows are the results/accounting footer. Row roles mark group headings and subtotals inside the body. |
| Index position | `header_cols` (leading), `trailing_header_cols` | Left, right, or double index. Index cells render as `th scope="row"`. |
| Spans | `document_region_table_merges` (unchanged) | rowspan/colspan. A merge may not cross a band boundary (header, body, footer). |
| Appearance | `document_region_table_rules.line` (`unknown`, `none`, `thin`, `thick`, `double`); `document_region_tables.banded` | Line evidence per grid rule and zebra rows. It never decides semantics. The overall ruling (grid, horizontal, none, mixed) is derived and never stored. |

`validTableStructure` (contracts) is shared by the API and the editor. It checks that header and footer do not overlap, that index columns fit, that row roles sit in the body, that merges are valid and stay inside one band, and that line updates refer to existing rules. `set_headers` and `create` accept the new fields: `footerRows`, `trailingHeaderCols`, `banded`, `rowRoles` (these replace the stored ones), and `ruleLines` (only the listed rules change). Correction payloads add these keys only when they are non-default, so older payloads stay byte-identical.

Detection keeps the same split. Text-only inference (`inferTableBands`) proposes footer rows from trailing total/tax labels, subtotals from subtotal labels, and section headings from body rows whose only text is in the first cell. Line evidence starts as `unknown`, because the layout IR carries no ruling segments yet. Only a person or a future line detector sets it.

What the survey says, versus what is built (Kasem et al., "Deep learning for table detection and structure recognition: A survey", arXiv 2211.08469):

* The survey covers datasets and methods. It defines no semantic taxonomy like matrix, financial or grouped. Our families are product presets on top of a neutral model.
* Its datasets describe structure as cells with start/end row and column, meaning spans (ICDAR 2013/2019, SciTSR, PubTabNet HTML). Header annotations come from PubTables-1M (with canonicalization against over-segmented headers), and FinTabNet covers financial tables. We store the same thing: rules, spans, and header/footer bands.
* It treats appearance separately: Marmot and TNCR distinguish full lined, partially lined, merged-cell and unlined tables, and it names borderless tables and spanning cells as the hard cases. That is why lines are evidence on rules and not part of the table type.
* Split-and-merge methods (SPLERGE, RobusTabNet) first predict a separator grid and then merge spanning cells. That matches our rules + merges, so a future learned detector can fill the same tables.

Future work: a worker step that emits ruling segments from PDF vector graphics (pdfplumber already finds lines for table detection) to set `line` evidence; multi-level column headers inferred from bold or centred header text; per-column header levels (stub headers spanning header rows); TEDS-style evaluation on synthetic fixtures; and showing derived ruling and zebra in exports.
* Merged cells: select a cell, then Shift+click or press M on a second cell to merge the rectangle; merging the same area again splits it. Layout, bands, row roles, lines and merges are saved as one `set_headers` correction, validated on the server against the grid and undoable from the toast. Body rows cycle through data, section and subtotal on the same grid.
* Not built yet: dragging dividers and snapping them to whitespace.
* Cell text edits use the existing `edit_cell` op.

### 4.6 Text (OCR) correction

* Click a line to edit inline. Enter saves and moves to the next line in reading order. Low-confidence tokens are underlined.
* Saved as a `block` correction (kind exists). The original OCR is always kept.

### 4.7 Labels and fields

* Labels: suggestions sit at the top of the workbench and accept with one click. Fields that depend on labels (`gateLabelIds`, existing) appear the moment the label is accepted, with no reload.
* NER fields: a field is a value plus anchor tokens (`document_field_token_spans`, existing). Drawing a box in Field mode with a field selected re-anchors it (`reanchor` op, existing).

### 4.8 More ideas worth doing ("Fällt dir noch was ein?")

* Reading order overlay (`L`), with drag-to-reorder in a list. Recompute it automatically only until a person has edited it (eScriptorium lesson). The model already has `reading_rank`.
* Header/footer exclusion: mark it once and propagate it to pages with matching geometry and text in the same document, previewed first. `header` and `footer` block types exist.
* Snap and magnet: snap box edges to the token hull and table dividers to whitespace valleys. Alt disables snapping.
* Focus mode (CVAT): zoom to the active region and Tab through its values.
* Confidence heatmap toggle on the page.
* Conflict-safe batch: "apply to similar documents" always shows the count and a sample before it writes, and is one correction scope that can be withdrawn.
* Per-document session summary at the end: n confirmed, m corrected, time taken. This feeds a throughput metric.

## 5. What exists today (CE)

| Capability | Backend | Frontend |
|---|---|---|
| Rect and polygon regions with vertices, roles field/table/block/ignore | `document_regions`, `document_region_vertices` | Rect drawing (`DocumentSelectionLayer`); polygon drawing not exposed |
| Field anchors and re-anchoring, value override | `document_region_fields`, `document_field_token_spans`, ops create/reanchor/edit_value/remove | Field correction sheet |
| Tables: rules, merges (rowSpan/colSpan), cell text, header rows/cols | `document_region_table_*`, ops create/set_headers/edit_cell/remove | Table correction sheet (headers, cells); no divider dragging or merge UI |
| Block types heading/paragraph/list/key_value/table/header/footer with reading rank | `document_region_block_types` | Outline tab (read-mostly) |
| Non-destructive corrections with withdraw | `corrections`, `superseded_by`, withdraw endpoints | Undo via toast for some actions |
| Rotation-aware geometry helpers | `region-geometry.ts` | Used for selection mapping |
| Field confirmations as training signal | `extraction_field_confirmations` | Workbench and field cards |

## 6. Gaps and the API/data model changes they need (3NF)

1. **Page transforms (rotate/deskew).** New table `document_page_transforms(document_id, page, rotation_quarter_turns smallint CHECK 0..3, deskew_deg real CHECK -15..15, correction_id uuid)`, PK `(document_id, page)`. New endpoint `POST /documents/:id/pages/:page/transform`, recorded as correction kind `page`. Geometry helpers take the transform; stored coordinates stay unrotated.
2. **Figure/graphic regions and sections.** Extend the `block_type` CHECK with `figure` and `caption`. Add `section` as a group type (see 3 in this list).
3. **Region groups (multi-page and logical sections).** `document_region_groups(id, document_id, kind CHECK ('continuation','section'))` and `document_region_group_members(group_id, region_id, ord)`, PK `(group_id, ord)`, UNIQUE `(group_id, region_id)`.
4. **Polygon in the UI.** The backend already supports it. Needs the Polygon tool, vertex handles, and validation that the polygon is simple and its bbox stays in range.
5. **Composable table structure (done).** Migration `document-region-table-structure` adds `footer_rows`, `trailing_header_cols` and `banded` to `document_region_tables`, `line` to `document_region_table_rules`, and a `document_region_table_row_roles` table. API change: `footerRows`, `trailingHeaderCols`, `banded`, `rowRoles`, `ruleLines` and `merges` on `create`/`set_headers`, checked by `validTableStructure` (shared in contracts). Families are a typed constant in the web app (`TABLE_FAMILIES`); only the resulting structure is stored.
6. **OCR line edits.** `block` corrections exist. Need an endpoint `POST /documents/:id/block-corrections { blockIndex, text }` that stores before/after in the correction row. Today `extractionBlocks` are replaced wholesale via PATCH, which loses per-line provenance.
7. **Undo/redo stack.** Client-only; relies on withdraw and re-apply. No schema change.
8. **Reading order edits.** `reading_rank` exists. Need an endpoint `POST /documents/:id/reading-order { regionIds[] }` recorded as one correction.

## 7. Status in PR #117

Done (vertical slice: field review loop):
* Split viewer: the document on the left, the sticky review workbench on the right. On mobile, decisions come first.
* Keyboard review: ↑/↓, J/K, Home/End, Enter or A accepts, E corrects in place, F moves the value to another field, N goes to the next document. Shortcuts are visible in the footer hint and in `aria-keyshortcuts`.
* Worst value first: rows are ordered by state, then confidence.
* Bulk accept only for extracted values with confidence ≥ 0.9 that nobody confirmed yet. Heuristic suggestions are never bulk-accepted.
* "Value right, field wrong" reassignment. A confirmed target is never overwritten silently (inline confirm, no modal).
* Every action saves at once with undo in the toast; there are no confirmation dialogs for reversible steps.
* `?review=1` deep link: the page opens focused on the first open value, and the next document opens the same way.
* E2E: keyboard-only loop, safe bulk accept, and the reassignment overwrite guard (synthetic mocks).
* Aspect strip in the viewer (Text, Labels, Layout, Fields) with open counts and a jump to the matching correction place.
* Table layout picker with merged-cell marking on recognised tables, stored through the existing table correction flow.

Next slices, in order of throughput impact:
1. OCR line editing with per-line corrections (gap 6).
2. Table divider dragging with snapping.
3. Layout tools: Box and Polygon, role palette 1-9, split/merge, reading-order overlay (gaps 2, 4, 8).
4. Page rotate/deskew (gap 1).
5. Multi-page groups (gap 3).
6. Undo/redo stack and autosave indicator across all of the above.


## Field suggestion decisions (accept / correct / reject)

Structuring decisions are durable per document. They are **not** a document-wide lock and they do
not delete OCR or other candidates.

| Decision | Meaning | Effect on open work |
|---|---|---|
| **Suggested** | Model or heuristic proposed a field+value; nobody decided yet | Counts as open |
| **Confirmed** | Person accepted the value, or corrected it then saved | Leaves open; value is the source of truth |
| **Rejected (`Verworfen`)** | Person dismissed this exact field+normalized value for this document | Leaves open/review queue; raw OCR and other candidates stay |
| Undecided | Person navigates away (`N`) or leaves the row alone | Stays open |

### Reject semantics

- Inline action beside Accept and Correct (slash-circle, tooltip "Vorschlag verwerfen"). No
  confirmation dialog.
- Identity is `(documentId, fieldKey, normalize(value))` where normalize trims, collapses
  whitespace and lowercases. Rejecting one value does not suppress other values for the same field.
- Persistence: `corrections` row with `op = reject_suggestion` plus
  `document_field_suggestion_decisions` (3NF). Withdraw the correction to undo.
- Open counts and the review queue exclude active rejects. History/Details can list
  "Verworfene Vorschläge" for undo.
- Re-extraction that proposes the same field+value again must not resurrect it into open work
  while the reject remains active. Accepting or correcting that value later withdraws the reject.

### What we deliberately do **not** model

- No document `locked` / "done" state for structuring.
- No global suppression of field names across the corpus.
- No `kein Wert` action unless a clear product need appears later.

