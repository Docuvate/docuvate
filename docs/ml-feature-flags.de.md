# ML-Feature-Flags (Community Edition 0.1.0 Beta)

Docuvate Community Edition schaltet optionale ML-Funktionen über **Feature-Flags pro Mandant** frei. Pro Flag gibt es einen ** installationsweiten Standard** (Umgebungsvariablen am API-Container) und optional **Mandanten-Overrides** in der Datenbank. Angemeldete Clients erhalten die aufgelösten Werte über `GET /v1/remote-config`. Installations-Administratoren setzen Overrides mit `PATCH /v1/admin/users/{userId}/feature-flags`.

Dieses Dokument beschreibt die ML-Flags in **0.1.0 Beta**, zugehörige Umgebungsvariablen, Docker-Compose-Profile, RAM-Empfehlungen und Hintergrund-Re-Index nach einem Embedding-Wechsel.

Siehe auch [Self-hosting](./self-hosting.md) (Compose-Betrieb, Englisch) und [AI models and ports](./ai-models.md) (Modelle und Chat-Provider, gemischt DE/EN).

## Flag-Referenz

Remote-Config nutzt **camelCase** (z. B. `exactAnswers`). Override-Zeilen in der Datenbank verwenden **snake_case** (z. B. `exact_answers`).

| Remote-Config-Key | Standard (0.1.0 Beta) | Env-Variable `DOCUVATE_FEATURE_*` | Wirkung |
| --- | --- | --- | --- |
| `exactAnswers` | aus | `DOCUVATE_FEATURE_EXACT_ANSWERS` | Strukturierter Fakten-Index beim Upload; Dokument- und Bibliotheks-Chat kann typisierte Abfragen und Aggregationen (Beträge, Anzahlen, Daten) aus indizierten Fakten beantworten, bevor Retrieval greift. |
| `answerAbstention` | aus | `DOCUVATE_FEATURE_ANSWER_ABSTENTION` | Mit `exactAnswers`: unsichere Treffer **verweigern** (z. B. „Nicht in den Dokumenten gefunden.“) statt in Embedding/RAG zu fallen — weniger Halluzinationen bei unbekannten Entitäten. Schwellwert standardmäßig **0,55** (pro Mandant überschreibbar in den Exact-Fact-Chat-Einstellungen). |
| `smartDuplicates` | aus | `DOCUVATE_FEATURE_SMART_DUPLICATES` | Template-bereinigte Duplikat-**Hinweise** zusätzlich zum Content-Hash. Nur UI-Hinweise; kein automatisches Zusammenführen oder Löschen. |
| `learnedValueTypes` | **an** | `DOCUVATE_FEATURE_LEARNED_VALUE_TYPES` | Gelernte Werttypen für globale Feldvorschläge (`amount`, `date`, `vendor`). Env `false` = installationsweit keine Vorschläge (Abstention, kein Regex-Fallback). |
| `layoutKeyValueRoles` | aus (**experimentell**) | `DOCUVATE_FEATURE_LAYOUT_KEY_VALUE_ROLES` | Layout-Key/Value-Rollen-Kopf auf Passage-Embeddings. Experimentell; Standard bleibt aus. |
| `localChatModel` | aus | `DOCUVATE_FEATURE_LOCAL_CHAT_MODEL` | Freie LLM-Antworten im zitierten Dokument-Chat über **lokales** Ollama, wenn das optionale Compose-Profil **`chat-local`** läuft. Ohne Flag weiterhin extractive / Retrieval-Pfade. |

Ältere Nicht-ML-Flags stehen in [Self-hosting](./self-hosting.md).

### Flags aktivieren

1. **Installations-Standard:** passende `DOCUVATE_FEATURE_*`-Variable in `.env` auf `true` (oder `1` / `yes`) setzen und API neu starten.
2. **Pro Mandant:** Admin-API-Override (siehe [Nutzer- und Rollenverwaltung](./user-administration.md)).
3. **Web-App:** nach Anmeldung Remote-Config.

`learnedValueTypes`: ist die Env-Variable **nicht gesetzt**, gilt **an**. Explizit `false`, `0` oder `no` schaltet ab.

### Zusammenspiel

- `answerAbstention` nur sinnvoll mit `exactAnswers`.
- `localChatModel` braucht **`OLLAMA_URL`** (Profil **`chat-local`**) und Modell **`qwen2.5:1.5b`** (Standard im Profil).
- Bei `smartDuplicates` entfällt embedding-basierte Duplikaterkennung zugunsten der Hinweise.

## Docker Compose und RAM

### Standard-Stack (ohne Ollama)

```bash
docker compose up -d
```

Startet API, Worker, PostgreSQL, MinIO, Valkey — **ohne Ollama**. Chat nutzt zitierte extractive Antworten und Retrieval; strukturierte Faktenantworten mit `exactAnswers`.

**Host-RAM:** **≥ ~6 GiB** für Compose-Limits plus Betriebssystem.

### Optionales lokales Chat-Modell (`chat-local`)

```bash
docker compose --profile chat-local -f docker-compose.yml -f docker-compose.chat-local.yml up -d
```

Startet Ollama und lädt **`qwen2.5:1.5b`** (Q4). Setzt standardmäßig `DOCUVATE_FEATURE_LOCAL_CHAT_MODEL=true` am API-Container; Mandanten brauchen trotzdem **`localChatModel`**.

**Host-RAM:** **≥ 8 GiB** empfohlen (Ollama-Limit standardmäßig **2g**).

### Komponenten-Budget (CPU, Richtwerte)

| Komponente | Typischer RSS |
| --- | ---: |
| Worker mit ONNX int8 **`multilingual-e5-small`** + OCR/Reranker | **~0,9–1,2 GiB** |
| API + Web + Postgres + Valkey + MinIO (idle) | ~1,5–2,5 GiB |
| Ollama **`qwen2.5:1.5b`** (`chat-local`) | ~2 GiB |

Encoder-Threads: **`DOCUVATE_ENCODER_INTRA_OP_THREADS`**, **`OMP_NUM_THREADS`**.

## Embedding-Wechsel und Hintergrund-Re-Index

Nach einem Encoder-Upgrade erhalten neue Uploads sofort aktuelle Vektoren. Bestehende Dokumente können noch eine ältere **`encoder_revision`** tragen.

Die API stellt **Hintergrund-Jobs pro Mandant** an (idempotent pro Dokument). Fortschritt für angemeldete Nutzer:

```http
GET /v1/settings/encoder-reindex
```

Große Bibliotheken können auf der CPU stundenlang re-indexieren — API und Worker laufen lassen, bis die Queue leer ist.

## Weitere Umgebungsvariablen

Siehe die englische Tabelle in [ML feature flags](./ml-feature-flags.md#related-environment-variables) (`DOCUVATE_FEATURE_*`, `OLLAMA_*`, `DOCUMENT_CHAT_PROVIDER`, `DOCUVATE_ENCODER_INTRA_OP_THREADS`).

Modellnamen und Lizenzen: **`THIRD_PARTY_MODELS.md`** im Repository (Community Edition).

## Geltungsbereich

Nur **Docuvate Community Edition**. Enterprise-Funktionen sind nicht beschrieben.
