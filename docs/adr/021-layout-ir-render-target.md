# ADR 021: Layout IR as product render target

## Status

Accepted.

## Context

The document detail view needs a layout-faithful preview (forms, columns, tables). Markdown is a poor primary view for structured pages. A versioned layout intermediate representation (IR) supports HTML/CSS preview in the product UI and Typst export for print-oriented workflows.

## Decision

1. **Worker** emits `layoutIr` (JSON, `version: 1`) alongside `text`, `blocks`, and internal `markdown` when geometry is available. OCR-only paths derive IR from extraction `blocks` without a second OCR pass. Layout IR build failures are logged and do not fail extraction.
2. **API** persists IR in `document_layout_ir` (1:1 with `documents`, JSONB `ir`, version column). List/detail queries expose `layout_ir_available` via `EXISTS` on that table; IR is loaded only for layout endpoints. `GET /v1/documents/{id}/layout-ir`, `GET /v1/documents/{id}/layout-html`, and `GET /v1/documents/{id}/layout-typst` use the same ABAC as document read.
3. **Web** replaces the Markdown tab with **Layout** (worker HTML in a sandboxed iframe; fit-to-width and zoom in the host). **Text** remains the reading pane. Typst source is downloaded from the API (worker renderer), not generated in the browser.
4. **Markdown** continues to be generated for search/RAG but is not a primary UI view.

## Consequences

- New documents receive IR on extraction; existing documents before this feature keep no layout IR until reprocessed.
- IR schema evolves via `layoutIr.version`; breaking changes require a new version and migration notes.
- Production code lives under `apps/worker`, `apps/api`, and `apps/web`.
