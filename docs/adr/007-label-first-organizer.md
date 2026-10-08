# ADR 007: Label-first organization

## Status

Accepted (2026-03-26)

## Context

Users think in themes and kinds (`Photovoltaik`, `Rechnung`, `Haus`) more than in rigid document-type taxonomies. Deep folder trees are costly to maintain. Mappe and Ordner should stay shallow buckets.

## Decision

1. **Labels (tags) are the primary organizer.** One vocabulary for Thema, Art, Projekt, and document kind. Matching rules and embedding suggestions stay on labels.
2. **Mappe / Ordner are optional buckets**, not the main mental model. Ordner nesting is capped at **three levels**.
3. **Document types are not a separate taxonomy.** Kind is expressed with labels only; there is no document-types API or schema table.
4. **Inferred placement** from label names to Mappe/Ordner names is shown as read-only hints; users adjust Mappe/Ordner manually if needed.
5. **Korrespondenten** remain optional “Wer” metadata, secondary in navigation.

## Consequences

- Library filtering emphasizes multi-label AND chips in the filter panel and sidebar.
- Struktur nav: Labels first, Korrespondenten second; no Dokumenttypen page.
- Product docs (`docs/mvp.md`) describe the label-first journey.
