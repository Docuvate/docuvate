# Processing / ingestion / reliability audit (2026-11-07)

Domain owner: processing, ingestion, and reliability on `main`.
Viewer/review rotation UI stays on unmerged PR 118 (`feat/review-bbox-page-rotation`). This change does not edit those files and does not reimplement `orient_page_for_ocr`.

## What was actually executed

| Layer                                                  | Where                                                    | Result                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unit tests (pure functions and mocked ports)           | This cloud VM, Node v24.22.2, API vitest                 | 538 tests passed in `vitest.config.ts`. Focused extraction and outbox specs are inside that run.                                                                                                                                                                                                                                                 |
| API contract tests                                     | This cloud VM, Node v24.22.2, after `nest build`         | 4 passed (`openapi-document`, `openapi-routes`, `public-route-allowlist`).                                                                                                                                                                                                                                                                       |
| API `tsc --noEmit` and ESLint on the touched API files | This cloud VM, Node v24.22.2                             | Both passed.                                                                                                                                                                                                                                                                                                                                     |
| Web unit tests and i18n key check                      | This cloud VM, Node v24.22.2                             | 394 tests passed. `check-i18n-keys.mjs` reported 1504 keys.                                                                                                                                                                                                                                                                                      |
| Integration (Postgres + Valkey via Testcontainers)     | This cloud VM, disposable containers only, Node v24.22.2 | 119 passed, 4 skipped. `job-outbox.integration.spec.ts` 7/7 passed, including the flush and tenant snapshot cases. Images are pinned `postgres:18.6-alpine` and `valkey/valkey:8-alpine`. Faults are `FLUSHALL` on that Valkey only. The Paperless suite did not become healthy: see below.                                                      |
| Mac health and Mac document E2E                        | Not executed                                             | Parent runtime reported `:5173`, `:3001/health`, and `:8001/health` healthy at 09:23 CET. This pass does not probe or drive that machine.                                                                                                                                                                                                        |
| Deployed SHA                                           | Unverified                                               | `.deploy-sha` was not read. Paths `/tmp/dv-deploy-202611061637` and `/tmp/dv-deploy-202611051653` were not opened.                                                                                                                                                                                                                               |
| SFTP and mail live calls                               | Not run                                                  | No external send.                                                                                                                                                                                                                                                                                                                                |
| Paperless import integration                           | This cloud VM, disposable compose                        | Did not pass. `docker compose` was missing at first (`unknown shorthand flag: 'f'`). After Compose 2.40.3, the web container's `init-wait-for-db` exited at 63s while Postgres 18.6 was still initializing. The database later listened on 5432, and Redis later accepted connections, on the same bridge. The four import tests stayed skipped. |

Local script (for the machine that owns the loopback stack; the library agent can shell out to it, it is not a Playwright test):

```bash
node tools/audit/proc-ingestion-reliability/guards.test.mjs
node tools/audit/proc-ingestion-reliability/audit.mjs
DOCUVATE_PROC_AUDIT_CONFIRM_LOCAL=1 node tools/audit/proc-ingestion-reliability/audit.mjs
DOCUVATE_PROC_AUDIT_CONFIRM_LOCAL=1 DOCUVATE_PROC_AUDIT_E2E=1 node tools/audit/proc-ingestion-reliability/audit.mjs
```

An earlier pass on Node v22.23.4 ran `node --test tools/audit/proc-ingestion-reliability/guards.test.mjs` (4 passed) and `node tools/audit/proc-ingestion-reliability/audit.mjs` with no confirm flag (exit 0, health and e2e `skipped-no-local-confirm`, no socket). This pass did not re-run that script and did not build a tarball.

Health is not E2E. A ready worker does not prove OCR, labels, NER, or tables.

## Disposable combined stack (snapshot)

Not part of this pull request's branch. The worktree was local and was not pushed. Images were rebuilt from it and the api, web, and worker containers were recreated on compose project `dvcombined`. `/health` was only a precondition.

Commit tuple fetched immediately before the run:

- PR 121 `3fe55df4f8d13ad30968013af9144e9572cf5a1e` on `cursor/viewer-review-orientation-40cd`, which includes PR 118 `4f1f5dc52d2b22aeae36fb8718b217c5071fa2ff`
- PR 119 `7c764bd0ddd201ace9487aa029b67d2167b53497`
- PR 120 `9595d3e4d34a1dd6a2e8f50277b7394a378fa354`

After that run, PR 119 moved to `980d0a58d3ddb4d9b49c8888383ac1aa0904f5e8` (`fix(web): keep document date filters and the page language` and two audit commits). Those commits were not in the images and were not retested.

The viewer agent owns the product ribbon and will move PR 121 past `3fe55df`. This section is evidence for that tuple only. It is not combined readiness. The ribbon was not implemented here. Bbox and table actions did not finish, so those steps have to be rerun on the later viewer commit.

Env: `E2E_WEB_URL=http://localhost:5173`, `E2E_API_URL=http://localhost:3001`, `DATABASE_URL=postgresql://docuvate:docuvate@127.0.0.1:5433/docuvate`. The browser origin and the API host are both `localhost`. `E2E_API_URL=http://127.0.0.1:3001` returned 401 from the page because the session cookie is for host `localhost`. `psql` 16 sent the seed statement to Postgres 18.

Official spec `e2e/real-stack/viewer-review-persist.spec.ts` with `playwright.real-stack.config.ts`, Chromium, retries 0:

- Signup, upload of a generated one-page PDF, and poll to `ready` succeeded.
- Three documents on this stack (two from that spec, one from a local continuation) each store `extracted_text` `NORTH 1842` and `INVOICE TOTAL`, two extraction blocks with those strings, status `ready`, and one `job_outbox` row `document-extraction` with status `done` and `attempts` 1.
- The worker wrote no `suggestion:%` row. The spec then inserted `suggestion:vendor` = `ACME GmbH` at confidence 0.55. Playwright printed `INSERT 0 1`. That reject is not extraction proof.
- The browser reject stored `document_field_suggestion_decisions` decision `rejected` for field `vendor`. The spec read that back after reload.
- `GET /v1/review-queue/summary` `pendingCount` stayed 0. The queue counts a suggestion only when confidence is at least 0.85 (`pg-document-review-queue.repository.ts`). The seeded 0.55 row is visible in the workbench and is not a pending queue document. The spec expected the count to fall and failed there. The official spec did not reach undo, rotation, bbox, or the table overlay.

A local continuation, not the committed spec and not pushed, logged the same 0 and 0 counts and went on:

- Undo set `withdrawn_at` on that decision.
- Clockwise rotate stored `document_page_transforms` page 1, `rotation_quarter_turns` 1, source `user`. The API readback assertion passed.
- `field-position-correct` never appeared. On this commit it is rendered only inside the workbench edit form, after Correct is opened (`DocumentReviewWorkbench.tsx`). The spec clicks it immediately. The run waited until the 240s timeout. No `document_regions` rows were written. The table overlay was not attempted.

CI run `42456109793` on `9595d3e` failed `quick-checks` because knip reported unused exported type `ExtractionAttemptFailurePlan`. The following commit keeps that type in the file and stops exporting it. The failure plan is unchanged.

## Disposable combined stack after the ribbon commit

Local worktree only, not pushed. API and web images were rebuilt from that worktree and recreated. The worker image was left in place: the worker tree did not change between `3fe55df` and this tuple. `/health` was only a precondition.

Tuple fetched immediately before the browser run, and still the branch tips afterwards:

- PR 121 `37544c8721b33f7942b4dff2ff63674d565a1485` (includes PR 118 `4f1f5dc52d2b22aeae36fb8718b217c5071fa2ff`)
- PR 119 `980d0a58d3ddb4d9b49c8888383ac1aa0904f5e8`
- PR 120 `94da10ca7a7257112449385eb8f23ab10ad852e5`

`review-queue-pagination.integration.spec.ts` on Node v24.22.2 against disposable Postgres: 4 passed, including `counts an open suggestion below 0.85`. The running API image still applies the 0.82 floor to label suggestions and does not apply 0.85 to field suggestions.

Official spec `e2e/real-stack/viewer-review-persist.spec.ts`, Chromium, `E2E_WEB_URL=http://localhost:5173`, `E2E_API_URL=http://localhost:3001`, `DATABASE_URL` on host port 5433. Document `ad76f238-e3c1-460b-87c8-a65c7de19e1d`:

- The spec read `NORTH 1842` and `INVOICE TOTAL` from the document API and saw no `suggestion:` fields before any seed. Those assertions passed. The worker then had one `job_outbox` row `done` with `attempts` 1. Status `ready`.
- The workbench had no reject control, so the spec inserted `suggestion:vendor` = `ACME GmbH` at confidence 0.55. That row is seeded. It is separate from the OCR text above.
- Browser reject, reload, decision readback, `pendingCount` decrease, undo, reload, empty decisions, and `pendingCount` restore all passed. The decision row is `rejected` with `withdrawn_at` set. The 0.55 suggestion did enter the queue.
- Clockwise rotate stored page 1, `rotation_quarter_turns` 1, source `user`. The API assertion passed.
- Correct was opened, then `field-position-correct`. A field region was stored (`x0` 0.200, `y0` 0.45, `x1` 0.573, `y1` 0.80) and the API assertion passed.
- `r` selected Area. The drag did not show `selection-mark-table`. No table region was written. The spec failed there. The assertion was left in place.

A separate browser script on the same stack, not the official spec, checked the ribbon after the same OCR text and with no extracted suggestions:

- Layout primary opened `app-ribbon-context` / `structuring-context` with `data-primary=layout`. `document-selection-tools` had three radios and sat in that row. `layout-viewer-toolbar` did not contain it. Area could be selected. Fields and Labels hid the context row.
- Text primary opened `structuring-edit-text` pressed and `structuring-save-text` disabled. The stage rendered one reading paragraph, `NORTH 1842 INVOICE TOTAL`, and no `.extracted-text-segment`. Save was not clicked. The edited text was not reloaded.

## Disposable combined stack after the text-edit commit

Local worktree only, not pushed. The web image was rebuilt from that worktree (`sha256:6c46966b82f5ea03cd0e6216323a458cf564211b216b1507085eae700c2880f7`) and the web container was recreated. The API image (`sha256:b70c7882b4006d216d56cb15988692bb6ee494259f12092cd389974eaf3c087e`) and the worker image (`sha256:2eae8304f35299a91438234910c3fda0664f733b59686a88b0f392555d4b7860`) stayed up: those trees did not change in `37544c8..e4ee4f7` or on PR 119/120 after those images were built. `/health` was only a precondition.

Tuple fetched immediately before the official spec, again before the text-save run, and still the branch tips afterwards:

- PR 121 `e4ee4f795d76a062bd46805d699bc74da77132b9` (includes PR 118 `4f1f5dc52d2b22aeae36fb8718b217c5071fa2ff`)
- PR 119 `980d0a58d3ddb4d9b49c8888383ac1aa0904f5e8`
- PR 120 `6432c968ca753f59480a80194bdc63dab8cdc8dc`

Official spec `e2e/real-stack/viewer-review-persist.spec.ts` with `e2e/playwright.real-stack.config.ts`, Chromium, `E2E_WEB_URL=http://localhost:5173`, `E2E_API_URL=http://localhost:3001`, Postgres on host port 5433. Document `c3703b84-7f78-448f-8c5f-873637233c3b`. The spec failed at `page.keyboard.press('r')` (`viewer-review-persist.spec.ts:226`): the Area radio was absent and Layout was not pressed. The assertion was left in place.

Passed before that failure, and present in Postgres:

- The API corpus contained `NORTH 1842` and `INVOICE TOTAL`. No `suggestion:` fields before the seed. Outbox row `done`, `attempts` 1. Status `ready`.
- The workbench had no reject control, so the spec inserted `suggestion:vendor` = `ACME GmbH` at confidence 0.55. That row is seeded. It is separate from the OCR text.
- Reject, reload, decision readback, `pendingCount` decrease, undo, reload, empty decision list, and `pendingCount` restore passed. The stored decision is `vendor` / `rejected` with `withdrawn_at` set.
- Clockwise rotate stored `rotation_quarter_turns` 1.
- Correct, then `field-position-correct`, then the page drag. Field region `x0` 0.200, `y0` 0.45, `x1` 0.573, `y1` 0.80. The API assertion passed.
- Table create, table readback, and a text edit were not reached.

A second Chromium script on the same stack, `e2e/real-stack/viewer-text-save-noloss.spec.ts`, stays in the local worktree. It uses the same API, worker, and Postgres. Document `d48114b4-1058-4afc-8538-fc50030542b0`.

- OCR text was `NORTH 1842` and `INVOICE TOTAL`. Suggestion keys were empty. Outbox `done`, `attempts` 1.
- Seeded `suggestion:vendor` at 0.55. `pendingCount` moved 1 → 0 on reject and back to 1 on undo. The script rejected again, so one decision stays active. Postgres holds two `vendor` / `rejected` rows: one withdrawn, one active.
- Label `audit-label-d48114b4` is attached. Page 1 is one quarter turn.
- Layout + Area, a drag, and creating field `auditbox` stored a field region `x0` 0.200, `y0` 0.450, `x1` 0.450, `y1` 0.800.
- Page fraction 0.55 on that quarter-turned page hits the Area radio. The page box starts above the viewport and the sticky ribbon covers the point (`elementFromPoint` returned the ribbon control). A drag on the empty page posted a table and the API answered 422 `documents.tableRegionEmpty`. Dragging the visible `INVOICE` span posted a table and the API answered 201. Cells are `NORTH 1842` and `INVOICE TOTAL`. Region `x0` 0.121, `y0` 0.128, `x1` 0.351, `y1` 0.197. Playwright's action click on `selection-mark-table` waited on a navigation and did not finish. The DOM `click()` on that same button sent the POST.
- Before the text save the API reported `layoutIrAvailable` true, one layout page, and `document_layout_ir` count 1. The field, the table, turn `[1]`, decision `vendor:rejected:` (withdrawn time empty), and the label were present. Both extraction blocks kept their boxes.
- Segment `NORTH 1842` was edited to `NORTH 1842 REVISED` and `structuring-save-text` PATCHed the document. After reload the API text is `NORTH 1842 REVISED` and `INVOICE TOTAL`. The `INVOICE TOTAL` box is unchanged (`0.12073863468527866`, `0.17389113029489767`, `0.22940340405583598`, `0.021169361572787516`). The revised block keeps the previous `NORTH 1842` box.
- After that save, `layoutIrAvailable` is false, layout pages are 0, and `document_layout_ir` count is 0. `document_layout_ir_pages` goes with that row. The field region, table region, quarter turn, both decision rows, the label, and the two extraction blocks read back equal. `PgDocumentRepository.updateForUser` deletes `document_layout_ir` when `extractionBlocks` is set. That is the derived layout IR. The manual rows above stayed.

## Disposable combined stack after the layout-text rewrite

Local worktree only, not pushed. The API image was rebuilt from the worktree that contains `1347d90` (`sha256:d9905846f869bf3652049d839a850432aefff735381c9dbd2adbb227b144d372`). The web image for this snapshot was `sha256:463e611622e24cf874ff4c311cb8aa54c7226180cdaa8f6779b415277b0c7dd2`. The worker image stayed `sha256:2eae8304f35299a91438234910c3fda0664f733b59686a88b0f392555d4b7860`. Browser origin `http://localhost:5173`, API `http://localhost:3001`, Postgres on host port 5433. `/health` was only a precondition.

Tuple fetched before these runs:

- PR 121 `1347d901176a375fb735cc75562735eb3aedea06` (includes PR 118 `4f1f5dc52d2b22aeae36fb8718b217c5071fa2ff`)
- PR 119 `980d0a58d3ddb4d9b49c8888383ac1aa0904f5e8`
- PR 120 `f952da4d09e72986ea460b4eeafc96fcfd78a37f`

`extraction-persistence.integration.spec.ts` on Node v24.22.2 against Testcontainers Postgres: 6 passed (5.35s). The case `keeps layout IR and writes the corrected block text into it` is in that run. The invalid-version case logged `Skipping layout IR … version must be 1` from `PgDocumentRepository`. `layout-ir-text.spec.ts`: 2 passed. `Button.spec.tsx`: 1 passed. The unit files are not the browser proof. The integration file did run on Postgres.

Official `e2e/real-stack/viewer-review-persist.spec.ts` with `playwright.real-stack.config.ts`, Chromium, retries 0. Normal pointer clicks. Document `08e42b73-8590-49a3-9305-c7062f33efa5`. 1 passed (11.7s).

- The API corpus contained `NORTH 1842` and `INVOICE TOTAL`. Suggestion keys were empty before the seed. Status `ready`. Outbox `done`, `attempts` 1.
- The workbench had no reject control, so the spec inserted `suggestion:vendor` = `ACME GmbH` at confidence 0.55. That row is seeded. It is separate from the OCR text.
- Reject, undo, quarter turn 1, field region `x0` 0.200, `y0` 0.450, `x1` 0.573, `y1` 0.800, and table region `x0` 0.223, `y0` 0.128, `x1` 0.304, `y1` 0.149 are in Postgres. `document_layout_ir` count is 1. The table step clicks Layout (`aria-pressed=true`), the Area radio, drags the visible `INVOICE` span, and clicks `selection-mark-table` with Playwright's action click. The spec does not edit text, so this pass does not prove the rewrite.

Local companion `e2e/real-stack/viewer-text-ir-retain.spec.ts` on the same images. Real `dblclick`, fill, Enter, and action clicks. No `force`. Document `df317597-7f0b-464b-ad47-e28bf9935984`. 1 passed (9.2s). A second run of the same file, document `ffe2fbde-dae4-458e-9f08-0d7163ee0fc8`, also passed and printed `IR_STALE false`.

- OCR text and empty suggestion keys came first. The seeded 0.55 row was rejected and then undone. Label, quarter turn, field box, and table box were stored before the text save. Counts before the save: layout IR 1, layout pages 1, regions 2, transforms 1, tags 1, decisions 1, blocks 2. The IR text contained `NORTH 1842`, `INVOICE TOTAL`, and `vectors`.
- `POST` table-corrections with rect `0.01,0.01,0.02,0.02` returned 422 and the body contained `documents.tableRegionEmpty`.
- The `NORTH 1842` segment was saved as `NORTH 1842 REVISED`. After reload the API text contains that string and `INVOICE TOTAL`, and `layoutIrAvailable` is true. IR count stays 1. Removing `NORTH 1842 REVISED` from the IR text leaves no `NORTH 1842`. Geometry with `text` keys removed is deep-equal. The `INVOICE TOTAL` block remains. Region, transform, tag, decision, and block counts stay. Field and table regions stay above zero. The turn list contains 1. The stored decision is `rejected` with `withdrawn_at` set: the reject control was absent after the field step (`IR_ACTIVE_REJECT false`), so this companion did not create a second active reject. The tag name stayed. Field `0.200, 0.450, 0.573, 0.800`. Table `0.223, 0.128, 0.304, 0.149`. Outbox `done`, `attempts` 1.

Button default `type="button"`. A scan of `apps/web/src` found 18 files with a `<Button` inside a `<form>`, and none of those buttons omit `type=`. Nineteen set `type="submit"`, including `RegisterPage`. The official spec signs up with `form.auth-form button[type="submit"]`, and that submit succeeded on this image. Web vitest, Node v24.22.2, with `@docuvate/contracts` resolved to a build of this worktree: 143 files, 425 tests passed. An earlier invocation that resolved contracts to the PR 120 package failed 3 tests because `suggestionRejectMatches` was missing there and `packages/tokens/dist/css/tokens.css` was absent in the worktree. That invocation is not the product result.

The web package checks on this tree: UI literals passed, i18n reported 1507 keys, global-search token check passed. `check-z-index-tokens.mjs` fails on raw `z-index: 1` at `app.css:471` and `app.css:17309`. The same raw `z-index: 1` is already on `1347d90` (`app.css:465`). `check-design-tokens.mjs` fails on undefined custom properties that `1347d90` already contains (`--dv-space-3` and the same family, 9 uses) and on raw-border-radius 27 against a baseline of 24. Raw spacing is 2 against a baseline of 0. `1347d90` already contributes `gap: 0.15rem`.

## Disposable combined stack after the ribbon stroke commit

PR 121 moved to `b1304bff1a5d9d570291a794c1f0e669118f74bb` (`fix(web): drop the ribbon tab stroke`). The diff from `1347d90` is `DocumentReviewWorkbench.tsx` (`showCaption={false}` on the structure group), `apps/web/src/styles/app.css`, and the mocked `e2e/tests/structuring/structuring-primary.spec.ts`. `layout-ir-text.ts`, the repository rewrite, and `Button.tsx` are the same blobs. The API image stayed `sha256:d9905846f869`. The web image was rebuilt to `sha256:eef16ff7e731fdf555ac3a7e7b17f7cf6c18392920970dd558e76b1fccbb585f` and only the web container was recreated. The worker image stayed. The `1347d90` runs above were left as that snapshot.

Tips fetched after `b1304bf` landed, and still the tips at the end of this note:

- PR 121 `b1304bff1a5d9d570291a794c1f0e669118f74bb` (includes PR 118 `4f1f5dc52d2b22aeae36fb8718b217c5071fa2ff`)
- PR 119 `980d0a58d3ddb4d9b49c8888383ac1aa0904f5e8`
- PR 120 `f952da4d09e72986ea460b4eeafc96fcfd78a37f` before this note

Official `viewer-review-persist.spec.ts` again, same config, same localhost cookie and Postgres 5433, against the new web and the unchanged API. Document `878b0996-7196-44ba-b0f1-c0cbd8057b0c`. 1 passed (10.0s). OCR text `NORTH 1842` / `INVOICE TOTAL` before the seed. Seeded `suggestion:vendor` at 0.55. Decision `rejected` with `withdrawn_at` set. Quarter turn 1. Field `0.200, 0.450, 0.573, 0.800`. Table `0.223, 0.128, 0.304, 0.149`. Layout IR count 1. Outbox `done`, `attempts` 1. This spec still does not edit text. The `df317597` save on the `1347d90` API image remains the rewrite proof.

`b1304bf` adds one raw spacing literal, `padding-top: calc(var(--dv-space-2xs) + 2px)`. With the existing `gap: 0.15rem`, `check-design-tokens.mjs` reports raw-spacing 2 > baseline 0. That extra literal is the new static-check failure on this commit.

Real-stack ribbon paint, `e2e/real-stack/viewer-ribbon-paint.spec.ts`, on the new web. Signup uses the submit button. Layout is clicked, the Area radio is visible, then the account menu's Dark radio is clicked. 1 passed (10.3s). Selected Layout and `app-ribbon-context` share a background, `border-top` `0px`, and shadow `none`, in light and in dark. The parent ribbon band background differs from that selected category. Dark `body` background is `rgb(30, 26, 19)`. Screenshots from that run: `/opt/cursor/artifacts/ribbon-hierarchy-light.png` and `/opt/cursor/artifacts/ribbon-hierarchy-dark.png`. The mocked structuring Playwright file was not executed. Its header says the API is mocked.

## Code inventory (not a live probe)

Upload allow-list in `packages/contracts/src/upload-formats.ts`: PDF, JPEG, PNG, WebP, GIF, TIFF, DOC/DOCX, XLS/XLSX, PPT/PPTX, ODT/ODS/ODP, RTF, CSV, plain text, Markdown, HTML, EML, MSG.

Plain text is stored and marked `ready` in the API without the extraction queue. Other allowed types are scheduled through `job_outbox` and BullMQ (`attempts: 1`; retries belong to the outbox).

Digital PDF rotation on `main` is a measurement (`page_rotations_deg` from glyph matrices). It does not rotate a scanned page before OCR. That raster step is PR 118.

Connectors present in the API: SFTP ingress, mail, Paperless import queues. They were not called.

## Matrix

| ID       | Preconditions                                                                              | Action                                                                                                                         | Expected                                                                                         | Actual before fix                                                                                                                                                  | Env + build                                                                     | Evidence                                                                                                                      | Finding                                              | Severity                     | Regression                                                                                              | Commit      |
| -------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------- | ----------- |
| PROC-001 | File bytes and a name whose extension is unknown or `.msg`                                 | Sniff MIME                                                                                                                     | TIFF, WebP, and OLE `.msg` detected; prose starting with "From" is not mail                      | `.msg` branch was unreachable (`application/msword`); TIFF/WebP had no magic; any buffer starting with `From` was `message/rfc822`                                 | Cloud unit test, no services                                                    | `upload-mime-resolve.spec.ts` passed                                                                                          | Mis-detect on upload                                 | Medium                       | `apps/api/src/shared/domain/upload-mime-resolve.spec.ts`                                                | this branch |
| PROC-002 | Outbox attempt 1 of 5, failure `document_unprocessable`                                    | Plan the attempt                                                                                                               | No retry                                                                                         | Processor always called `markFailedOrRetry`, which retried until `maxAttempts`                                                                                     | Cloud unit test and disposable Testcontainers                                   | `plan-extraction-job-failure.spec.ts`; integration `fails a non-retryable attempt...` passed                                  | Permanent failures were requeued                     | High                         | same specs                                                                                              | this branch |
| PROC-003 | `worker_deadline`, outbox attempts 3, deadline cap 3, BullMQ `attempts: 1`                 | Plan the attempt                                                                                                               | Stop                                                                                             | Planner read BullMQ `attemptsMade`, which stays 0, so the deadline cap never fired                                                                                 | Cloud unit test                                                                 | `planExtractionAttemptFailure` deadline case                                                                                  | Deadline cap was dead                                | High                         | `plan-extraction-job-failure.spec.ts`                                                                   | this branch |
| PROC-004 | Outbox row returned to `pending` for a later attempt; BullMQ job then emits `failed`       | Persist terminal failure                                                                                                       | Leave the document retryable                                                                     | `persistFinalJobFailure` treated every final BullMQ failure as terminal and stored `failed` during backoff                                                         | Cloud unit test of the decision. Processor wired to it. Not observed on the Mac | `shouldPersistTerminalExtractionFailure`                                                                                      | False failure during backoff                         | High                         | `plan-extraction-job-failure.spec.ts`                                                                   | this branch |
| PROC-005 | Defaults: outbox lease 15 min, BullMQ lock 20 min                                          | Choose the running reclaim window                                                                                              | Running reclaim waits at least the lock                                                          | One lease covered `enqueued` and `running`, so a live extract could be reclaimed                                                                                   | Cloud unit test                                                                 | `extraction-queue.config.spec.ts`                                                                                             | Duplicate in-flight risk                             | High                         | `outbox lease windows`                                                                                  | this branch |
| PROC-006 | Running row, `attempts >= maxAttempts`, lease expired                                      | Relay claim                                                                                                                    | Mark failed, do not enqueue                                                                      | Claim set the row back to `pending` with attempts unchanged, so a crash loop never stopped                                                                         | Disposable Testcontainers, `JOB_OUTBOX_RUNNING_LEASE_MS=1000`                   | Integration `fails a leased running job...` passed                                                                            | Attempt cap bypassed on crash                        | High                         | `job-outbox.integration.spec.ts`                                                                        | this branch |
| PROC-007 | Document owned by user B, including an existing `running` outbox and `extracting` document | User A schedules extraction                                                                                                    | Owner document jsonb and outbox jsonb stay equal; no second row                                  | `UPDATE documents ... WHERE id = $1` had no `user_id` predicate                                                                                                    | Disposable Testcontainers plus the HTTP use-case unit test                      | Integration `leaves the owner document and outbox unchanged when another user schedules`                                      | Cross-tenant status write at the repository          | High                         | integration spec + `queue-extraction.use-case.spec.ts` (forbidden schedule is not turned into `failed`) | this branch |
| PROC-008 | Outbox `running`, document `extracting`                                                    | Schedule the same document again                                                                                               | Leave `extracting`                                                                               | Schedule always set `queued`, so a second claim could start                                                                                                        | Disposable Testcontainers                                                       | Integration `does not move an in-flight extraction back to queued` passed                                                     | In-flight status clobber                             | High                         | integration spec                                                                                        | this branch |
| PROC-009 | Mac API and worker up                                                                      | GET `/health`, `/health/ready`, `/v1/health`                                                                                   | 200                                                                                              | Not executed this pass. Parent reported those three checks healthy at 09:23 CET                                                                                    | Not this VM                                                                     | Parent report, not a probe from here                                                                                          | Health only, not re-checked here                     | Info                         | `audit.mjs` still requires an explicit confirm flag before it opens a socket                            | this branch |
| PROC-010 | Confirm flag, E2E flag, sign-up open                                                       | Sign up a new user, upload book/tax/building/recipe/lyrics text plus one small PDF, poll only those ids, delete only those ids | Text becomes `ready` without OCR; PDF reaches `ready` or a visible `failed`                      | Not executed this pass                                                                                                                                             | Not this VM                                                                     | `audit.mjs`                                                                                                                   | Live ingest not run                                  | Info                         | Guard tests exist; this pass did not run them                                                           | this branch |
| PROC-011 | Rotated scan                                                                               | OCR on upright pixels                                                                                                          | Not implemented on `main`                                                                        | `rotation_stage` records glyph rotation and does not raster-orient                                                                                                 | Code read. No rotated fixture executed here                                     | `page_rotation.py`, `rotation_stage.py`                                                                                       | Scan orientation is PR 118's job                     | Info (gap, not patched here) | existing `test_rotation_stage.py` (not re-run; no worker venv in this pass)                             | none        |
| PROC-012 | SFTP, mail, or Paperless credentials                                                       | Import                                                                                                                         | No live call from this audit                                                                     | Implementations exist; mocks/live stacks were not started                                                                                                          | Not run                                                                         | connector modules, `tools/paperless-test`                                                                                     | Blocked: no safe live credentials used               | Info                         | existing connector tests, not re-run                                                                    | none        |
| PROC-013 | Valkey `FLUSHALL` on the disposable container                                              | Two cases: flush before the worker starts; flush while one attempt is inside the processor                                     | Enqueued rows are rebuilt and each document runs once. An in-flight attempt stays one completion | BullMQ `Missing key for job … moveToFinished` is `JobNotExist` (`-1`) after the hash is gone. It is the queue ack, not a second run and not a lost Postgres commit | Disposable Testcontainers only. No Mac fault                                    | `rebuilds enqueued rows after Valkey FLUSHALL…` and `finishes one in-flight attempt when FLUSHALL deletes the BullMQ job key` | Acknowledged cache loss, recoverable from the outbox | Info                         | Those two integration tests                                                                             | this branch |

## PR 118 (report only)

Read at `origin/feat/review-bbox-page-rotation` (`page_orientation.py`). Not copied.

| ID             | Finding                                                                                                                                                                                                                                                                    | Severity                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| PROC-PR118-001 | `score_ocr_orientation` returns 0 when the page does not look sideways and the upright OCR score is already > 0. A 180° page that still yields some score is never compared with a half-turn. Sideways candidates are `(0, 1, 3)`, so 180° is also skipped in that branch. | Medium, for the viewer/review agent |

No compatibility patch was applied on shared files. `main` still has no `orient_page_for_ocr`. Glyph `rotationDeg` and a future page-transform quarter turn are different values; this PR does not mix them.

## Fixes in this branch

- Outbox attempt planning uses the outbox attempt count and the failure's `retryable` flag. Deadline attempts stop at `DOCUMENT_EXTRACTION_DEADLINE_MAX_RETRIES`.
- `markFailedOrRetry(..., { allowRetry: false })` fails immediately.
- Lease reclaim uses a longer window for `running` rows (at least the BullMQ lock, unless `JOB_OUTBOX_RUNNING_LEASE_MS` is set). Rows already at `max_attempts` are failed with `documents.extractionFailureCode.attempts_exhausted` instead of being requeued.
- BullMQ's `failed` event does not mark the document failed while the outbox row is still pending, enqueued, running, or done.
- Scheduling requires `documents.user_id` to match and does not demote `extracting` back to `queued` while that outbox row is still active.
- Upload sniff recognises TIFF, WebP, and OLE `.msg`, and requires real mail headers before `message/rfc822`.

## BullMQ `Missing key` after `FLUSHALL`

`Scripts.moveToFinished` throws `Missing key for job <id>. moveToFinished` when its Lua script returns BullMQ `ErrorCode.JobNotExist` (`-1`). `FLUSHALL` deletes the job hash while a live worker can still be inside the processor.

Both cases below use only the Testcontainers Valkey. They do not touch a Mac or a user volume.

1. Flush before the worker starts. Each outbox row is still `enqueued` with `attempts = 0`, and the BullMQ job is gone. After the enqueued lease, the relay claims the row. The worker runs once. The row is `done` with `attempts = 1`. The document stays `queued`. The worker records no missing-key error. A later relay leaves `attempts` at 1.
2. Flush while the processor is between `markRunning` and `markDone`. The in-memory attempt still stores `done`, and `attempts` stays 1. BullMQ then fails the ack with that exact missing-key string for that job id. The document stays `queued` with a null failure reason. A later relay does not run the document again.

The missing key is the queue ack for a hash that no longer exists. Postgres already holds the attempt. It is not a second execution. A dead worker plus a flushed key is a different case: the `running` lease, which defaults to at least the BullMQ lock, has to expire before the relay rebuilds the row. This pass does not kill the API process.

`relayOnce()` counts rows for which `markEnqueued` still matched. If the worker stored `done` first, that count is lower than the number of documents. The tests assert the outbox row, the attempt count, and the execution count.

## Review

Failure policy stays in `planExtractionAttemptFailure` and `shouldPersistTerminalExtractionFailure`. The repository transaction owns the tenant check, the document update, and the reclaim. The relay claims and enqueues. `claimForRelay` fails a spent attempt and returns the rest in the same commit, so a crash cannot requeue it. That stays one method.

Jobs that arrive without an outbox id still use `planProcessorFailure` and BullMQ `attemptsMade`. Current enqueue paths write an outbox id. That branch was not changed.

## Not claimed

These tests do not prove the Mac stack, a rotated scan, label/NER/table quality, or connector import. They do not prove that no other regression exists. The `37544c8` disposable run stored one field box on an upright PDF after a quarter turn and did not save a table or an edited OCR string. The `e4ee4f7` run saved both, and it dropped `document_layout_ir` on that text save while the manual rows stayed. The `1347d90` save rewrote the matching line, left `document_layout_ir` at count 1, and kept the other line's geometry and the manual rows. The `b1304bf` web rerun repeated the official spec and did not edit text. None of these runs exercised 180° OCR.
