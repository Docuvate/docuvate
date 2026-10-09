# @docuvate/sdk

Official TypeScript/JavaScript client for the Docuvate **headless** `/v1` API.

## Install

```bash
pnpm add @docuvate/sdk
```

## Quickstart

```typescript
import { DocuvateClient } from '@docuvate/sdk';

const client = new DocuvateClient({
  baseUrl: process.env.DOCUVATE_API_URL ?? 'http://localhost:3001/v1',
  apiKey: process.env.DOCUVATE_API_KEY,
});

const { data, error } = await client.api.listDocuments({
  query: { q: 'lease agreement', status: 'ready' },
});
if (error) throw error;

for (const doc of data.items) {
  console.log(doc.title, doc.documentDate);
}
await client.api.createDocument({ body: formData });
```

`client.api` exposes **every** OpenAPI operation (generated via `@hey-api/openapi-ts`).

## Regenerate

```bash
pnpm openapi:export
pnpm --filter @docuvate/sdk codegen
```

## API version

SDK **1.0.0** tracks OpenAPI **v1** (`info.version` in the exported spec).
