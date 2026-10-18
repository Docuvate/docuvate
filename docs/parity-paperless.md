# Paperless parity roadmap

Before replacing Paperless in a production migration:

- Import from Paperless (`PaperlessImportPort`)
- Tags, correspondents, document types **with matching rules (shipped)**
- Bulk download / bulk edit (partial — bulk API shipped)
- Consume folder watcher

## Matching (shipped)

| Paperless | Docuvate | Behavior |
| --- | --- | --- |
| None | `none` | No auto action |
| Any | `any` | Match → **Vorschlag** |

(See main repository docs for the full matching table.)
