# Docuvate CE – Fix-Liste (Box-Audit 2026-11-05)

**Stand:** 2026-11-05, Europe/Berlin  
**Commit:** `67cfe8f` (`fix(web): UX overhaul – corrections, small screens and scale (#88)`)  
**Scope:** alle Use Cases in `docs/use-cases.md` + Frontend Clean Architecture/SOLID + Doctor-Tools  
**Nicht enthalten:** Outbox+Retry (separater PR — nicht duplizieren)

## Abdeckung (Kurz)

| Quelle | Ergebnis |
| --- | --- |
| API-Probes (Smoke-User) | UC1–3,5–7,9–12,14,16–18 verifiziert; UC4 unverified; UC8 Ranking unverändert aus Mac-Audit |
| SPA-Shells | `/login`, `/library`, `/settings`, `/structure/labels`, `/duplicates`, `/connectors` → 200 |
| Playwright-E2E im Repo | ~56 Specs mapen UI-Journeys inkl. Small-Screen (390/375) |
| Pixel-Klicks auf der Box | eingeschränkt (Docker-DNS tot; Worker-Image-Build 2× apt-500 abgebrochen) |
| Doctors (pinned Baseline) | NestJS **89**/99, React **59**/62 Critical, FastAPI **84**/92 |

Legende Status: **works** / **partial** / **broken** / **unverified** — Details in `docs/use-cases.md`.

---

## P0 (Release-Blocker — größtenteils schon gemerged)

| ID | Thema | UC | Status | PR-Schnitt |
| --- | --- | --- | --- | --- |
| P0-1 | Region-Selection / leere Tokens | 14, 15 | behoben | bereits **#68** — Regression-E2E grün halten |
| P0-2 | Merge-Vorschläge Labels | 11 | behoben (disabled) | bereits **#69** |
| P0-3 | Chat aus MVP | 16 | behoben | bereits **#70** |
| P0-4 | Recognized-Fields UX + falsches „Bestätigt“ | 12, 13 | offen/teilweise | **#71** zu Ende führen |

---

## P1 (nächste UI/Produkt-PRs)

| ID | Thema | UC | Evidenz | Vorschlag PR-Schnitt |
| --- | --- | --- | --- | --- |
| P1-1 | Globale Suche Ranking | 8 | Mac: Exact-Title nur 2/15 auf Rang 1; RRF Embedding = Lexikal | **PR A:** RRF-Gewichte / Exact-Match-Boost + Ranking-Fixture-E2E (kein ML) |
| P1-2 | Ingest-Retry / Bulk-Retry | 2 | Mac ~1,3 % `fetch failed`; nur manuelles Requeue | **Separater Outbox-PR** (nicht hier nachbauen) |
| P1-3 | Feedback-Loop Felder in UI absichern | 13, 14 | API Tokens/Regions OK; Confirm-Body leicht falsch → 400 | **PR B:** UI Confirm/Correct Happy-Path E2E + DTO-Doku; Small-Screen Review-Wizard |
| P1-4 | Frontend-Codequalität (Doctors + Architektur) | — | siehe Abschnitt unten | **PR C:** react-doctor Errors + Barrel-Lücken + `api.ts` split (ohne Feature-Verhalten) |
| P1-5 | Doctors unter Baseline | — | 89/59/84 vs 99/62/92 | Teil von PR C + CI-Vorschlag unten |

---

## P2

| ID | Thema | UC | Vorschlag |
| --- | --- | --- | --- |
| P2-1 | Docs ohne Layout-IR/Tokens warnen + Re-Run | 3 | Badge + Requeue-CTA |
| P2-2 | Rotation E2E + optionale manuelle Drehung | 4 | Fixture 90°/180° + Spec |
| P2-3 | Feldwerte CSV/JSON Export aus Bibliothek | 17 | Export-Endpoint + UI; `GET /v1/documents/export` Footgun (UUID `:id` → 500) entschärfen |
| P2-4 | `scripts/doctors.sh` an Baseline-Pins angleichen | — | `@latest` entfernen; FastAPI cwd = `apps/worker` |
| P2-5 | Chat-Tabellen Drop-Migration | — | Follow-up Cleanup |
| P2-6 | Connector-/Plugin Happy-Path auf Box | Plugins | Paperless/SFTP mit Test-Secrets (nach DNS-Fix) |

---

## Frontend-Codequalität

### Doctor-Lauf (2026-11-05, one-off `pnpm dlx` / `uvx`, keine neue Dev-Dependency)

| Paket | Score | Baseline | Delta | Schwere Findings (Auszug) |
| --- | --- | --- | --- | --- |
| nestjs-doctor@0.9.10 (`apps/api`) | **89** | 99 | −10 | Controller `list` mit Daten-Transformation; Controller injiziert Repository direkt (`PgConnectorSourceScopeRepository`) — SOLID/DIP |
| react-doctor@0.9.17 (`apps/web`) | **59 Critical** | 62 | −3 | **2 Errors:** `no-impure-state-updater` (`ConnectorSourceScopePicker.tsx:98`); `no-ref-current-in-render` (`useApiHealthReconnect.ts:32`); 163 Warnings (a11y, await-in-loop, derived state, …) |
| fastapi-doctor==0.12.0 strict (`apps/worker`) | **84** | 92 | −8 | u. a. `exception-swallowed` (22), `env-mutation` (11), `import-bloat` (9); Toolchain `ty` failed |

`scripts/doctors.sh` weicht ab ( `@latest`, FastAPI ohne `--from`/`--score`/cwd) — Nightly nutzt korrekt `scripts/testing/doctor-ratchet.mjs` + `docs/testing/doctor-baseline.json`.

### Architektur-Check (React Clean Architecture / SOLID)

| Prüfung | Befund |
| --- | --- |
| Feature-Grenzen | `depcruise` Rule `web-feature-isolation` vorhanden; **Barrels fehlen** für: `admin`, `connectors`, `dashboard`, `errors`, `layout`, `review`, `saved-views`, `search`, `ui` (vorhanden: auth, documents, labels, library, ordner, save, settings, upload) |
| Dependency-Richtung | Pages → Components/Lib OK mehrheitlich; **Verstöße:** `lib/*` importiert UI-Typen aus `components/ui` und `components/library`; `components/library/SaveViewDialog` importiert Hook aus `pages/library` (UI ← Page, falsch) |
| Components vs Hooks vs API | Hooks verstreut (`lib` 27+, Pages, Components). **`apps/web/src/lib/api.ts` ≈ 1214 LOC / 129 Exports** — God-Client, ISP/SRP-Verstoß; Feature-Clients (`lib/documents`, `lib/labels`, …) nur teilweise ausgelagert |
| Große UI-Einheiten | `DocumentDetailPage` 810, `DocumentLayoutWorkspace` 1025, `LibraryDocumentTable` 1010, `GlobalSearch` 714 — schwer testbar, hohe Kopplung |
| lint:arch | `pnpm lint:arch` = depcruise + knip + jscpd — gut, aber Doctors nur in **nightly**, nicht in PR-`ci.yml` |

### Empfohlene Doctor-Checks in CI

1. **PR-Gate (hart):** `node scripts/testing/doctor-ratchet.mjs` in `.github/workflows/ci.yml` (gleiche Pins/Baseline wie Nightly). Kein Score unter Baseline → fail.  
2. **PR-Gate (hart, schon da erweitern):** `pnpm lint:arch` weiterhin auf PRs.  
3. **Warnung (weich):** Score &lt; `targetMinScore` 95 → `::warning` (Ratchet macht das schon).  
4. **React Errors hart:** zusätzlich Fail bei `react-doctor` **error-count &gt; 0** (auch wenn Score ≥ Baseline), bis die 2 Criticals weg sind.  
5. **Lokal:** `scripts/doctors.sh` auf Baseline-Commands umbiegen (P2-4); **kein** `npx react-doctor install` / keine neue Dev-Dependency nötig — one-off `pnpm dlx react-doctor@0.9.17` reicht (Dependencies-Skill).  
6. **Baseline-Pflege:** nach PR C Scores nach oben ratcheten (React ≥ 62 → Ziel 70+, Nest/FastAPI schrittweise Richtung 95).

---

## PR-Slicing (nur Vorschläge — keine Fix-PRs in diesem Audit)

| PR | Inhalt | Abhängigkeit |
| --- | --- | --- |
| Docs (dieser PR) | `use-cases.md` Refresh + diese Fix-Liste | — |
| Outbox+Retry | Ingest backoff + bulk retry | separat, bereits autorisiert |
| PR A | Search RRF / lexical boost + E2E | nach Docs |
| PR B | Feld-Confirm UI E2E / DTO | nach #71 |
| PR C | Frontend doctors errors + barrels + api.ts split | parallel zu A |
| PR D | CI: doctor-ratchet auf PR-ci.yml + doctors.sh Pins | nach oder mit C |
| ML später | NER-Recall Eval | nach UI-Stabilität |

## Aufräumen nach Audit

- Temp-Logs unter `/tmp/dvaudit/` und Cookie-Jar nicht committen.  
- Box-Container `dvaudit-*` / Host-API bei Bedarf stoppen; keine Secrets in Dateien geschrieben (nur Inline-Env).
