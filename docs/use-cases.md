# Docuvate CE – Use cases (MVP)

Scope of the MVP: **ingest → OCR → labeling → named-entity / field recognition → confirm/correct → find → export**.
The chat (document chat and global library chat) is **removed** from the MVP (#70).

Status legend:
**works** · **partial** · **broken** · **unverified** (not probed live).

Audits:
- Reference Mac deploy aggregates: **2026-11-04** (large corpus; ranking/NER recall numbers).
- Box CE stack (compose infra + host-network API + leftover host worker + web :5173), tip **67cfe8f** / #88: **2026-11-05** (synthetic smoke user + one PDF fixture; API+proxy evidence). Full pixel click-through was limited on the box (Docker DNS broken; worker image build failed twice on apt mirror — stopped per two-attempt rule). Existing Playwright smoke/e2e still map the UI journeys.

| # | Use case | Status (box 2026-11-05) | Notes |
| --- | --- | --- | --- |
| 1 | Login | works | `POST /api/auth/sign-in/email` + session via nginx `/api` proxy |
| 2 | Upload / ingest | works (retry gap = P1, outbox PR separate) | PDF → `ready` ~10s; no auto/bulk retry yet |
| 3 | OCR incl. scans | works (minor IR gaps remain from Mac) | Fixture: text + Layout IR + 1 token + vendor field |
| 4 | Page rotation | unverified | No rotated fixture this run; worker has `page_rotation.py` |
| 5 | Document list / library | works | `/v1/documents` + SPA `/library` |
| 6 | Folders | works | Create folder, PATCH document into folder |
| 7 | Search (library list) | works | `GET /v1/documents?q=` |
| 8 | Search (global top bar) | broken (ranking) | Mac probes still authoritative; 1-doc corpus cannot refute |
| 9 | Labels | works | List/create via `/v1/tags`; assign `POST /v1/documents/:id/tags/:tagId` |
| 10 | Label suggestions | works (API) | `/v1/labels/recommendations` 200 (empty/warming OK) |
| 11 | Label merge suggestions | works (disabled) | #69 — merge endpoint absent/404 by design |
| 12 | Recognized fields (definitions) | partial (UX) | `/v1/recognized-fields` OK; UX still #71 |
| 13 | Field values / suggestions (NER) | partial | Built-in vendor hit on fixture; user-field recall still low (Mac) |
| 14 | Confirm / correct with region selection | works (API; UI via #68 e2e) | `/v1/documents/:id/layout/tokens` + regions; #68 |
| 15 | Tables | partial | Same IR/token path as 14; empty table on text-only PDF expected |
| 16 | Settings | works | `/v1/settings` 200; chat settings gone (#70) |
| 17 | Export | partial | Original `GET …/content` works; no library CSV/JSON; connector export needs installation |
| 18 | Duplicates | works (API empty-ok) | `/v1/duplicate-sets` 200 |

## 1. Login

- **Expected:** e-mail/password sign-in via better-auth; session cookie grants access to `/v1`.
- **Verify:** `POST /api/auth/sign-in/email` → 200, then `GET /v1/settings` → 200.
- **Status:** works.
- **E2E:** yes (`e2e` auth/smoke). **Small screen:** login forms covered by auth pages / workstream e2e.

## 2. Upload / ingest

- **Expected:** PDF/JPEG/PNG upload; document becomes `ready` after extraction; failures are visible and retryable.
- **Verify:** upload a PDF and a phone-photo JPEG; both reach `ready` within minutes; `extractionFailureReason` is empty.
- **Status:** works on box fixture (PDF → ready, no failure reason). Mac aggregate still showed ~1.3 % `failed` / `fetch failed`. Retry exists only per document (requeue); **automatic retry with backoff / bulk retry is owned by the separate outbox PR — do not duplicate here**.
- **E2E:** yes (upload smoke). **Small screen:** upload queue / compact bar e2e.

## 3. OCR (incl. scans)

- **Expected:** every ready document has full text, a Layout IR and page word tokens (with boxes); scans/photos are OCR’d.
- **Verify:** document `extraction.text` non-empty; `layoutIrAvailable`; `GET …/layout/tokens` > 0.
- **Status:** works for the box PDF fixture (text `Docuvate Audit Invoice INV-AUD…`, IR page 1, 1 token, vendor field). Mac: >98 % OK; ~1 % PDFs text without IR/tokens.
- **E2E:** yes. **Small screen:** document view responsive specs.

## 4. Page rotation

- **Expected:** rotated scans are detected and displayed upright; OCR runs on the corrected orientation.
- **Verify:** upload a 90°/180° rotated scan; text is readable; IR blocks carry `rotationDeg`.
- **Status:** unverified on box (no rotated fixture). Worker detects dominant page rotation; viewer only rotates the text layer; no manual rotate action.
- **E2E:** no dedicated UC4 rotation e2e. **Small screen:** n/a.

## 5. Document list / library

- **Expected:** paginated list with title, document date, folder, labels; sort and filter.
- **Verify:** `/library` SPA; `GET /v1/documents` returns items with folder/tags.
- **Status:** works.
- **E2E:** yes (library list / perf). **Small screen:** library mobile DOM budget + responsive specs.

## 6. Folders

- **Expected:** create/rename folders, move documents, filter list by folder.
- **Verify:** create folder, move a document, filter.
- **Status:** works (box: create + move into folder).
- **E2E:** yes. **Small screen:** folders 390px UX audit asset.

## 7. Search – library list

- **Expected:** `GET /v1/documents?q=` finds a document by any rare word of its text or its title.
- **Status:** works (Mac 15/15; box list search 200).
- **E2E:** yes. **Small screen:** yes.

## 8. Search – global top bar

- **Expected:** typing the exact title or a rare word returns that document at rank 1 (at least top 3).
- **Verify:** `GET /v1/search?q=<exact title>&limit=20`; check rank of the target.
- **Status:** broken (ranking). Mac: exact-title rank-1 only 2/15; missing top 20 in 4/15; rare-word 6/25 in top 8. Suspected: RRF gives embedding leg equal weight to lexical legs without exact-match boost. Box 1-doc corpus returned the only hit at rank 1 (not a ranking proof).
- **E2E:** yes (`global-search*`, incl. small viewport). **Small screen:** `global-search-small-viewport.spec.ts`.

## 9. Labels

- **Expected:** create, rename, delete, assign/unassign labels; label counts are correct.
- **Status:** works (`/v1/tags` CRUD + document tag assign). Note: bare `GET /v1/labels` is 404 by design (overview routes are under `/v1/labels/recommendations|map|…`).
- **E2E:** yes. **Small screen:** labels vocabulary small-screen spec.

## 10. Label suggestions

- **Expected:** embedding/heuristic suggestions appear; accept/dismiss works.
- **Status:** works (API). Box recommendations returned empty/warming with empty library history — expected. Mac: partial when only merge proposals existed (pre-#69).
- **E2E:** yes. **Small screen:** yes.

## 11. Label merge suggestions

- **Expected:** merge proposals are safe or hidden for MVP.
- **Status:** works (disabled) via **#69**.
- **E2E:** regression covered. **Small screen:** n/a.

## 12. Recognized fields (definitions)

- **Expected:** manage global/user field definitions in structure UI.
- **Status:** partial (UX) — API `/v1/recognized-fields` works; configuration UX tracked by **#71**.
- **E2E:** labels-fields-scale. **Small screen:** recognized-fields cards at 390px.

## 13. Field values / suggestions (NER)

- **Expected:** vendor/date/amount and user fields filled with confidence; confirm/correct feedback loop.
- **Status:** partial. Box fixture produced vendor≈0.98. Mac: built-ins common, user-defined fields rare. Unconfirmed-as-“Bestätigt” when confidence missing addressed in **#71**.
- **E2E:** review / fields flows. **Small screen:** document mobile panes.

## 14. Confirm / correct with region selection

- **Expected:** select words/regions on the page; corrections stick; feedback recorded.
- **Status:** works at API after **#68** (`layout/tokens`, `regions`, correction endpoints). Live pixel selection not re-clicked on box this run; rely on #68 + e2e.
- **E2E:** yes. **Small screen:** document-view-responsive / layout mobile.

## 15. Tables

- **Expected:** tables in IR shown; region selection yields cells.
- **Status:** partial (same token/IR path as 14). Text-only one-line PDF has no table — expected empty.
- **E2E:** covered with layout fixtures. **Small screen:** yes.

## 16. Settings

- **Expected:** user preferences and extraction engine options are read and saved.
- **Status:** works; chat/LLM settings removed by #70.
- **E2E:** yes. **Small screen:** settings forms.

## 17. Export

- **Expected:** download original; export documents with metadata/fields to a connector; ideally CSV/JSON of field values from library.
- **Verify:** `GET /v1/documents/{id}/content` (box: 200, 597 bytes); `POST /v1/connectors/installations/{id}/export` (needs installation — unverified).
- **Status:** partial. Original download works. No CSV/JSON field export in library UI. Mistaken `GET /v1/documents/export` hits `:id` and 500s (UUID parse) — footgun, not a product export API.
- **E2E:** connector export paths partial. **Small screen:** n/a.

## 18. Duplicates

- **Expected:** duplicate sets detected and stacked; review UI.
- **Status:** works (API `/v1/duplicate-sets`; empty corpus OK). Mac: stacks detected on reference deploy.
- **E2E:** yes. **Small screen:** duplicate dialogs.

## Plugins / connectors (MVP adjacency)

- **Catalog:** `GET /v1/connectors/catalog` → 200 (dms / home_automation / mail / …).
- **Installations:** empty on fresh box tenant.
- **UI:** SPA `/connectors` shell 200. Full OAuth/Paperless/SFTP click-through not completed this run (secrets/host ports).

## Infra notes (box audit only — not product bugs)

- Compose inter-container DNS (`127.0.0.11`) broken on this box; API run with `--network host` against published postgres/valkey/minio ports.
- Worker Docker image build failed twice (apt 500 via 198.18.0.1); used existing host uvicorn worker from prior `/tmp/dv-ux` session (compatible extract).
- `scripts/doctors.sh` still uses `@latest` / wrong fastapi cwd — **nightly ratchet** uses pinned `docs/testing/doctor-baseline.json` (source of truth).

## MVP release blockers (refreshed 2026-11-05)

P0 = must ship before release. Outbox+retry = **separate PR** (do not duplicate item 8 below as new work if that PR is in flight).

1. **P0 – Region selection** (14, 15) → shipped in **#68** (keep regression e2e green).
2. **P0 – Wrong label merge suggestions** (11) → **#69**.
3. **P0 – Chat out of MVP** → **#70**.
4. **P0 – Recognized-fields configuration UX / false “Bestätigt”** (12, 13) → **#71**.
5. **P1 – Global search ranking** (8): lexical / exact-title boost or lower embedding weight in RRF.
6. **P1 – Low NER recall for user-defined fields** (13): extractor + eval set (ML later per MVP order).
7. **P1 – Failed ingest retry** (2): owned by **outbox+retry PR** (backoff + bulk retry) — track, don’t fork.
8. **P1 – Frontend-Codequalität / doctors** — see `docs/audits/2026-11-05-box-uc-fix-list.md` § Frontend-Codequalität (react-doctor below baseline; feature barrels incomplete; `api.ts` god client).
9. **P2 – Documents without Layout IR / tokens** (3): warn + re-run.
10. **P2 – Rotation** (4): rotated fixture e2e + optional manual rotate.
11. **P2 – Field-value export** (17): library CSV/JSON; avoid `:id` export footgun.
12. **P2 – Doctor CI on PRs** — promote ratchet from nightly-only; align `scripts/doctors.sh` with pinned baseline.

Follow-ups (not blockers): drop leftover `chat_*` tables migration; remove donut / `large_local_llm` / `cpu_rag` flags.
