# Docuvate CE – Use cases (MVP)

Scope of the MVP: **ingest → OCR → labeling → named-entity / field recognition → confirm/correct → find → export**.
The chat (document chat and global library chat) is **removed** from the MVP (PR “remove chat”).

Status legend (audited on the reference Mac deploy, 2026-11-04, aggregates only):
**works** · **partial** · **broken** · **unverified** (not probed live).

| # | Use case | Status |
| --- | --- | --- |
| 1 | Login | works |
| 2 | Upload / ingest | partial |
| 3 | OCR incl. scans | works (minor gaps) |
| 4 | Page rotation | partial |
| 5 | Document list / library | works |
| 6 | Folders | works |
| 7 | Search (library list) | works |
| 8 | Search (global top bar) | broken (ranking) |
| 9 | Labels | works |
| 10 | Label suggestions | partial |
| 11 | Label merge suggestions | broken → fixed by #69 |
| 12 | Recognized fields (definitions) | partial (UX, PR 4) |
| 13 | Field values / suggestions (NER) | partial (low recall) |
| 14 | Confirm / correct with region selection | broken → fixed by #68 |
| 15 | Tables | partial (depends on #68) |
| 16 | Settings | works (chat fields removed by chat PR) |
| 17 | Export | unverified |
| 18 | Duplicates | works |

## 1. Login

- **Expected:** e-mail/password sign-in via better-auth; session cookie grants access to `/v1`.
- **Verify:** `POST /api/auth/sign-in/email` → 200, then `GET /v1/settings` → 200.
- **Status:** works.

## 2. Upload / ingest

- **Expected:** PDF/JPEG/PNG upload; document becomes `ready` after extraction; failures are visible and retryable.
- **Verify:** upload a PDF and a phone-photo JPEG; both reach `ready` within minutes; `extractionFailureReason` is empty.
- **Status:** partial. ~1.3 % of documents are `failed` with reason `fetch failed` (API → worker HTTP call failed at ingest time, e.g. worker restarting/unreachable). Retry exists only per document (requeue on the detail page); there is no automatic retry with backoff and no bulk retry.

## 3. OCR (incl. scans)

- **Expected:** every ready document has full text, a Layout IR and page word tokens (with boxes); scans/photos are OCR’d.
- **Verify:** `GET /v1/documents/{id}` text non-empty; layout IR present; page-1 tokens > 0.
- **Status:** works for > 98 % of documents; all JPEG scans have tokens and text. A small number of PDFs (≈1 %) have text but no Layout IR or zero page tokens, so region selection cannot work on them.

## 4. Page rotation

- **Expected:** rotated scans are detected and displayed upright; OCR runs on the corrected orientation.
- **Verify:** upload a 90°/180° rotated scan; text is readable; IR blocks carry `rotationDeg`.
- **Status:** partial. Worker detects dominant page rotation (`cpu_pipeline/page_rotation.py`) and records `rotationDeg` per block; the viewer only rotates the text layer. There is no manual “rotate page” action. Not verified end-to-end with a rotated fixture.

## 5. Document list / library

- **Expected:** paginated list with title, document date, folder, labels; sort and filter.
- **Verify:** `/documents` page loads; `GET /v1/documents` returns items with `documentDate`, folder, tags.
- **Status:** works (≈94 % of documents carry a document date, all carry labels).

## 6. Folders

- **Expected:** create/rename folders, move documents, filter list by folder.
- **Verify:** create folder, move a document, filter.
- **Status:** works.

## 7. Search – library list

- **Expected:** `GET /v1/documents?q=` finds a document by any rare word of its text or its title.
- **Verify:** pick a rare word from a document text; the document is in the result.
- **Status:** works (15/15 probes).

## 8. Search – global top bar

- **Expected:** typing the exact title or a rare word returns that document at rank 1 (at least top 3).
- **Verify:** `GET /v1/search?q=<exact title>&limit=20`; check rank of the target.
- **Status:** broken. Exact-title probes: target at rank 1 in only 2/15, missing from the top 20 in 4/15; rare-word probes: 6/25 in the top 8. Root cause (suspected): reciprocal-rank fusion gives the embedding leg (`rankDocumentsByEmbedding`, top 30, cosine > 0.25) the same weight as the lexical legs and there is no exact-match/lexical boost, so semantically similar documents outrank the exact hit.

## 9. Labels

- **Expected:** create, rename, delete, assign/unassign labels; label counts are correct.
- **Status:** works.

## 10. Label suggestions

- **Expected:** suggestions for new labels / assignments are plausible and accept/reject works.
- **Verify:** `GET /v1/labels/recommendations`; accept one, it is applied.
- **Status:** partial. On the reference deploy all current recommendations are merge proposals (see 11).

## 11. Label merge suggestions

- **Expected:** only propose merging labels that are true duplicates.
- **Status:** broken → fixed by **#69** (merge proposals disabled for MVP + regression test).
- **Root cause:** a pair was proposed when `namesAreNearDuplicate` (Levenshtein ratio ≤ 0.22) **and** centroid cosine ≥ 0.9. Label centroids of one library are almost all similar (median pairwise cosine ≈ 0.955), so the cosine gate filters nothing; the name gate then matches sibling labels like “Rechnung 2023” / “Rechnung 2024” (the majority of name-matched pairs differ only by digits and share 0 % of their documents).
- **Follow-up:** `namesAreNearDuplicate` is also used for sibling-label creation and blocklist matching; the label-map `highOverlapPairs` threshold (0.78) has the same weakness.

## 12. Recognized fields – definitions

- **Expected:** define a field (name, type, which labels it applies to); edit later.
- **Status:** partial (UX).
- **UX note / PR 4:** the right column “Vorgaben für neue Felder” on `/structure/recognized-fields` is removed. The label-rule selection moves into the create/edit field dialog as a searchable multi-select combobox with chips, built from existing design-system components. One place to configure a field.

## 13. Field values / suggestions (NER)

- **Expected:** for each document the configured fields (e.g. date, sender, gross amount) are extracted with value, confidence and source position; low confidence is shown as “to review”, not “confirmed”.
- **Verify:** field attempts per document: share `found` vs `not_found`/`below_threshold`.
- **Status:** partial. Built-in suggestion fields (vendor, date, amount) are present on most documents, but user-defined global fields are found on very few documents (e.g. date on ~6 %, sender on ~2 %); `not_found` + `below_threshold` dominate the attempts. This is the main quality gap for “good NER”.
- **Bug:** a field value with **no** confidence renders as “Bestätigt” (`(confidence ?? 1) >= 0.85`).

## 14. Confirm / correct with region selection

- **Expected:** user selects a region in the viewer; words under the region fill the field; position is stored.
- **Status:** broken → fixed by **#68**.
- **Root cause:** layout tokens were fetched once per (document, page) and never refetched when the Layout IR appeared or changed (`layoutIrRevision`); the viewer kept an empty token set → selection found 0 words, regions became image-only, tables showed “empty region”. Plus a race on page switch. #68 adds `useDocumentRegionLayers`, keyed on the IR revision.

## 15. Tables

- **Expected:** tables detected in the IR are shown; region selection over a table yields cells.
- **Status:** partial; the empty-table symptom is the same root cause as 14 (#68). Not probed separately.

## 16. Settings

- **Expected:** user preferences and extraction engine options are read and saved.
- **Status:** works; chat/LLM settings are removed by the chat-removal PR.

## 17. Export

- **Expected:** download original; export documents with metadata/fields to a connector.
- **Verify:** `GET /v1/documents/{id}/content`; `POST /v1/connectors/installations/{id}/export`.
- **Status:** unverified. There is no CSV/JSON export of field values from the library UI.

## 18. Duplicates

- **Status:** works (duplicate sets detected and stacked).

## MVP release blockers

Prioritized. P0 = must ship before release.

1. **P0 – Region selection broken** (14, 15) → #68.
2. **P0 – Wrong label merge suggestions** (11) → #69.
3. **P0 – Chat in the product although out of MVP scope** → chat-removal PR.
4. **P0 – Recognized-fields configuration UX** (12) → PR 4.
5. **P0 – Unconfirmed values shown as “Bestätigt”** (13) when confidence is missing.
6. **P1 – Global search ranking** (8): exact title / rare word must rank first (lexical boost or lower embedding weight in RRF).
7. **P1 – Low NER recall for user-defined fields** (13): needs extractor work and an evaluation set; not a small fix.
8. **P1 – Failed ingest not retried** (2): automatic retry with backoff on transient worker fetch errors, and a bulk “retry failed” action.
9. **P2 – Documents without Layout IR / tokens** (3): surface as warning, allow re-run.
10. **P2 – Rotation** (4): end-to-end check with rotated fixture; manual rotate.
11. **P2 – Export of field values** (17).

Follow-ups (not blockers): drop migration for the old chat tables; remove the donut extra and the `large_local_llm` / `cpu_rag` hardware flags.
