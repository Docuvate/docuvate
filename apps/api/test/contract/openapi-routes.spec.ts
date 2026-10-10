import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll,describe, expect, it } from 'vitest';

import {
  auditOpenApiAgainstRoutes,
  collectNestHttpRoutes,
} from '../../src/openapi/openapi-route-audit.js';
import { createContractTestApp } from './create-contract-test-app.js';

describe('OpenAPI route coverage', () => {
  let app: NestFastifyApplication | undefined;

  afterAll(async () => {
    await app?.close();
  });

  it('documents every public /v1 route and forbids flagged or unauthenticated gaps', async () => {
    const fixture = await createContractTestApp();
    app = fixture.app;
    const registered = collectNestHttpRoutes(app);
    const audit = auditOpenApiAgainstRoutes(fixture.openApi, registered);

    expect(audit.missingFromSpec, JSON.stringify(audit.missingFromSpec, null, 2)).toEqual([]);
    expect(audit.extraInSpec, JSON.stringify(audit.extraInSpec, null, 2)).toEqual([]);
    expect(audit.flaggedOperations, JSON.stringify(audit.flaggedOperations, null, 2)).toEqual([]);
    expect(audit.missingSecurity, JSON.stringify(audit.missingSecurity, null, 2)).toEqual([]);
  });
});
