import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll,describe, expect, it } from 'vitest';

import {
  auditPublicRoutes,
  collectPublicHttpRoutes,
  PUBLIC_ROUTE_ALLOWLIST,
  publicRouteKey,
} from '../../src/shared/infrastructure/auth/public-route-audit.js';
import { createContractTestApp } from './create-contract-test-app.js';

describe('Public route allowlist', () => {
  let app: NestFastifyApplication | undefined;

  afterAll(async () => {
    await app?.close();
  });

  it('matches the explicit allowlist of @Public() routes', async () => {
    const fixture = await createContractTestApp();
    app = fixture.app;

    const discovered = collectPublicHttpRoutes(app);
    const audit = auditPublicRoutes(discovered);

    expect(
      audit.missingFromAllowlist,
      `New @Public() routes (update PUBLIC_ROUTE_ALLOWLIST): ${JSON.stringify(audit.missingFromAllowlist)}`
    ).toEqual([]);
    expect(
      audit.extraInAllowlist,
      `Stale allowlist entries (remove @Public() or fix wiring): ${JSON.stringify(audit.extraInAllowlist)}`
    ).toEqual([]);

    expect(discovered.map(publicRouteKey)).toEqual(PUBLIC_ROUTE_ALLOWLIST.map(publicRouteKey));
  });
});
