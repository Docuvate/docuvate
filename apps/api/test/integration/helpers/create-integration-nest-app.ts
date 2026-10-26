// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import multipart from '@fastify/multipart';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from '../../../src/app.module.js';
import { DOCUMENT_REPOSITORY } from '../../../src/shared/domain/ports.js';
import { initializeAuth } from '../../../src/shared/infrastructure/auth/better-auth.config.js';
import { registerBetterAuthHttpRoutes } from '../../../src/shared/infrastructure/auth/register-better-auth-http-routes.js';
import { PG_POOL } from '../../../src/shared/infrastructure/database/tokens.js';
import { API_VERSION_PREFIX } from '../../../src/shared/presentation/api-version.js';
import { ProblemDetailsExceptionFilter } from '../../../src/shared/presentation/problem-exception.filter.js';
import { getIntegrationPool } from '../pg-pool.js';
import { InvalidDatePatchingDocumentRepository } from './patching-document.repository.js';

export interface CreateIntegrationNestAppOptions {
  /** Force invalid `documentDate` on listed docs (reproduces main `RangeError: Invalid time value`). */
  patchInvalidDocumentDates?: boolean;
}

export async function createIntegrationNestApp(
  options: CreateIntegrationNestAppOptions = {}
): Promise<NestFastifyApplication> {
  process.env.BETTER_AUTH_SECRET ??= 'integration-test-better-auth-secret-32ch!';
  process.env.BETTER_AUTH_URL ??= 'http://localhost:3001';
  process.env.MINIO_ENDPOINT ??= '127.0.0.1';
  process.env.MINIO_PORT ??= '9000';
  process.env.MINIO_ACCESS_KEY ??= 'minioadmin';
  process.env.MINIO_SECRET_KEY ??= 'minioadmin';
  process.env.MINIO_BUCKET ??= 'docuvate';
  process.env.WORKER_URL ??= 'http://127.0.0.1:8000';

  const auth = await initializeAuth();
  const adapter = new FastifyAdapter({ logger: false });

  let builder = Test.createTestingModule({ imports: [AppModule] });
  if (options.patchInvalidDocumentDates) {
    const pool = getIntegrationPool();
    builder = builder.overrideProvider(DOCUMENT_REPOSITORY).useFactory({
      factory: () => new InvalidDatePatchingDocumentRepository(pool),
      inject: [PG_POOL],
    });
  }

  const moduleFixture = await builder.compile();
  const app = moduleFixture.createNestApplication<NestFastifyApplication>(adapter, {
    bodyParser: true,
  });
  await app.register(multipart, {
    limits: { fileSize: 25 * 1024 * 1024 },
  });
  registerBetterAuthHttpRoutes(adapter.getInstance(), auth);
  app.setGlobalPrefix(API_VERSION_PREFIX, {
    exclude: [
      { path: 'health', method: RequestMethod.ALL },
      { path: 'health/ready', method: RequestMethod.ALL },
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );
  app.useGlobalFilters(new ProblemDetailsExceptionFilter());
  await app.init();
  return app;
}
