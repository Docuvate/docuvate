# Document library filter query

Shareable URL param: `?filter=…` on `/documents`.

## Grammar

Whitespace-separated tokens. Quote values with spaces: `"annual report"`.

| Token | Meaning |
| --- | --- |
| `in:inbox` or `is:inbox` | Inbox view only |
| `label:Name` | Label filter (repeat for AND) |
| `status:ready` | Status filter |
| `status:extraction` | Maps to `extracting` |
| `status:queued` | Queued |
| `status:uploaded` | Uploaded |
| `status:error` | Maps to `failed` |
| `title:…` or bare words | Full-text search (title, filename, body) |

Use `/documents?filter=in:inbox` for the inbox view. Only the `filter` query param is supported on `/documents`.
