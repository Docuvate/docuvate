# ADR 016: Global search (hybrid lexical + optional semantic)

## Status

Accepted.

## Context

- Compose targets `postgres:18.6-alpine`. **pg_trgm** and **unaccent** ship as contrib extensions. **No pgvector** in the default Alpine image.
- Document embeddings live in **`document_embeddings.embedding` (JSONB)** with FK to `documents`.
- Extracted field *values* are indexed in **`document_field_values`** (FK `documents`, `"user"`), derived from the document's extraction result. A versioned migration builds the index for documents that already exist. **No duplicate table.**
- DDL and index changes are delivered as TypeORM migrations with `up`/`down`.

## Decision

1. **No pgvector** in migrations or runtime for global search.
2. **Hybrid lexical ranking (Postgres + RRF):**
   - **FTS** on `documents.search_vector` and `document_text_chunks.search_vector`.
   - **pg_trgm** (`word_similarity`, `%`, `<%`) on titles, filenames, folder/label names, chunk bodies, and **`document_field_values.value_text_norm`**.
   - **Silent typo correction:** vocabulary neighbors expand the query server-side (`expandedTerms`); **no “did you mean” UI or API field.** Fuzzy legs return the right documents directly with highlights on matched text.
   - Optional **semantic leg:** embed query via **`EmbeddingPort`**, cosine similarity in-process over **`document_embeddings` JSONB**, fused with lexical ranks (bounded candidate set).
3. **Custom / recognized fields:**
   - **Text:** same normalization + trgm as titles (e.g. typo `Nordwnd` → Absender **Nordwind**).
   - **Amounts / dates:** normalize both sides (`12,50` / `12.50` / `EUR 12.50`; `15.03.2024` / `2024-03-15` / localized dates) then **exact** match on `value_numeric` / `value_date` (no edit distance on numbers).
   - **Field filters:** `absender:nordwind`, `betrag:12,50`; the field name fuzzy-matched against catalog keys/labels; palette may suggest field keys while typing.
   - **Writes:** `document_field_values` updated only from extraction / field confirmation via **`SyncDocumentFieldValuesUseCase`** (application layer). **Search is read-only** on the HTTP path. Initial data: versioned backfill migration (up/down).
4. **Chunk index + vocabulary:** `document_text_chunks` and `search_vocabulary_terms` updated only from extraction / document update via **`SyncDocumentSearchIndexUseCase`**. **Search GET is read-only.** Existing document rows: versioned backfill migration (up/down).

## Consequences

- Runs on the PostgreSQL 18 image used by compose and CI.
- Semantic quality is document-level until chunk embeddings or external ANN exist.
- Schema migrations remain ordered and reversible via TypeORM.
