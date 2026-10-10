import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import type { OpenAPIObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface.js';
import { Test } from '@nestjs/testing';

import { AppModule } from '../../src/app.module.js';
import { buildOpenApiDocument } from '../../src/openapi/build-openapi-document.js';
import { applyOpenApiGenerationOverrides } from '../../src/openapi/openapi-generation-overrides.js';

process.env.BETTER_AUTH_SECRET ??= 'openapi-generate-dev-secret-32chars!!';
process.env.BETTER_AUTH_URL ??= 'http://localhost:3001';
process.env.DATABASE_URL ??= 'postgres://unused:unused@127.0.0.1:5432/unused';
process.env.VALKEY_URL ??= 'redis://127.0.0.1:6379';
process.env.MINIO_ENDPOINT ??= '127.0.0.1';
process.env.MINIO_PORT ??= '9000';
process.env.MINIO_ACCESS_KEY ??= 'minioadmin';
process.env.MINIO_SECRET_KEY ??= 'minioadmin';
process.env.MINIO_BUCKET ??= 'docuvate';
process.env.WORKER_URL ??= 'http://127.0.0.1:8000';

export async function createContractTestApp(): Promise<{
  app: NestFastifyApplication;
  openApi: OpenAPIObject;
}> {
  let builder = Test.createTestingModule({ imports: [AppModule] });
  builder = applyOpenApiGenerationOverrides(builder);
  const moduleFixture = await builder.compile();

  const app = moduleFixture.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter({ logger: false })
  );
  await app.init();

  const openApi = buildOpenApiDocument(app);
  return { app, openApi };
}
