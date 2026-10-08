# MVP

## USP

**Docuvate** — Belege und Dokumente mit **strukturierter Extraktion** (Felder, nicht nur Text) und einer UX, die sich wie ein modernes Beleg-OS anfühlt — self-hostable, CPU-first, bereit für Chat später.

*Paperless-superset path: parity first for your archive, then beyond.*

## Mental model (Label-first)

1. **Labels** = Haupt-Organizer (Thema + Art in einem Vokabular): z. B. `Photovoltaik`, `Rechnung`, `Haus`, `Erdarbeiten`.
2. **Mappe / Ordner** = flache Ablage-Eimer (Mappe flach; Ordner max. **3 Ebenen**). Optional, nicht der primäre Suchweg.
3. **Korrespondent** = optionales „Wer“, sekundär in der Navigation.
4. Abgeleitete **Ablage-Hinweise** aus Label-Namen zu Mappe/Ordner (Vorschlag, nicht Pflicht).

Siehe `docs/adr/007-label-first-organizer.md`.

## Journey (MVP)

1. Register / login (email + password, session cookie).
2. Upload PDF/image → Posteingang-Label, async extraction via Valkey queue.
3. `ready` with text + heuristic fields; born-digital PDFs skip OCR; scans use PaddleOCR. **Rule-based label matching** after extract, plus **embedding suggestions** (CPU/ARM).
4. Search/filter library (Postgres FTS, **multi-label AND**, inbox, correspondent). Mappe/Ordner filter in sidebar tree.
5. Document detail: **Labels**, chat, **pdf.js preview** (eine Scrollleiste, Mehrseiten), kompakte Extraktion, **Arena** (2+ Engines vergleichen + Bewertung), metadata; Mappe/Ordner in Metadaten.
6. Sidebar: Posteingang · Dokumente · **Label-Schnellfilter** · **Mappen** (Mappe → Ordner Baum) · Struktur (Labels, Korrespondenten) · **Einstellungen** (Konto + OCR-Engine, optional Arena-Gewinner).
7. **Duplicate stacks** after extract (hash + embedding): inbox/library collapse versions into one row; review dialog to compare, set primary, keep version, dismiss false positive, or delete duplicate.
8. Logout; unauthenticated API calls return 401.

## Shipped (Beleg-OS iteration)

- `docs/design-system.md`, extended CSS tokens, Chip/Dropzone primitives
- Label suggestions + auto-assign (`all` / `exact` / `regex`; `any` → Vorschlag)
- Labels page: **Empfehlungen** (neue Labels, Zusammenführen/Umbenennen aus Extraktion + Embeddings) und **Labelraum** (PCA-3D-Karte, interaktiv)
- Taxonomy API with matching fields on tags; former document-type CRUD removed (use labels)

## Shipped (Embeddings + Chat)

- Worker `/embed` with **fastembed** + multilingual MiniLM (ONNX, CPU/ARM — see `apps/worker/README.md`)
- kNN + tag centroids learn from Übernehmen/Verwerfen (Posteingang ausgeschlossen)
- Label panel **Aktualisieren** → `POST /documents/:id/tag-suggestions/refresh`
- **DocumentChatPort**: pluggable providers (default **Kontext** via Worker, optional **donut-ml**, **Ollama**, dev mock), Settings UI
- Left sidebar IA, ink indigo tokens, custom `Select`, folders + **Mappen** API, duplicate stacks + review UI, extraction blocks (see `docs/ai-models.md`)

## Out of scope (designed for)

- Paperless importer UI
- OIDC IdP (port only)
- Meilisearch
- GoBD / audit claims

## Test hints

1. **Labels:** Struktur → Labels → `Photovoltaik` und `Rechnung` anlegen. Dokument öffnen → Tab Labels → beide zuweisen. Dokumente → Filter **Labels** → beide Chips aktiv → Liste zeigt Schnittmenge.
2. Upload two similar PDFs; label the first; open the second → Vorschläge with Embedding-Ähnlichkeit or refresh.
3. Document detail → Dokument-Chat → ask a question (dev mock without Ollama; set `DOCUMENT_CHAT_MODE=mock` in API).
4. Mappe/Ordner: Sidebar Mappen → Ordner anlegen (max. 3 Ebenen); Ablage-Hinweis erscheint wenn Label-Name zu Mappe/Ordner passt.
