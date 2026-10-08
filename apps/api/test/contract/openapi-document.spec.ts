import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import SwaggerParser from '@apidevtools/swagger-parser';
import { describe, expect, it } from 'vitest';

const OPENAPI_PATH = resolve(process.cwd(), '../../openapi/docuvate.v1.json');

describe('OpenAPI contract (static)', () => {
  it('validates the committed /v1 OpenAPI document', async () => {
    const api = await SwaggerParser.validate(OPENAPI_PATH);
    expect(api.openapi).toMatch(/^3\.(0|1)\.\d+$/);
    expect(api.info?.title).toBeTruthy();
    expect(api.paths && Object.keys(api.paths).length).toBeGreaterThan(10);
  });

  it('exposes core document paths for contract consumers', () => {
    const raw = readFileSync(OPENAPI_PATH, 'utf8');
    const doc = JSON.parse(raw) as { paths: Record<string, unknown> };
    expect(doc.paths['/documents']).toBeDefined();
    expect(doc.paths['/openapi.json']).toBeDefined();
  });
});
