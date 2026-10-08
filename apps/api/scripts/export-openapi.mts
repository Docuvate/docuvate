/**
 * Headless OpenAPI export from NestJS + Swagger (no database / Valkey / BullMQ).
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

process.env['DOCUVATE_OPENAPI_HEADLESS'] = '1';
process.env['BETTER_AUTH_SECRET'] ??= 'openapi-generate-dev-secret-32chars!!';
process.env['BETTER_AUTH_URL'] ??= 'http://localhost:3001';
process.env['DATABASE_URL'] ??= 'postgres://unused:unused@127.0.0.1:5432/unused';
process.env['VALKEY_URL'] ??= 'redis://127.0.0.1:6379';
process.env['MINIO_ENDPOINT'] ??= '127.0.0.1';
process.env['MINIO_PORT'] ??= '9000';
process.env['MINIO_ACCESS_KEY'] ??= 'minioadmin';
process.env['MINIO_SECRET_KEY'] ??= 'minioadmin';
process.env['MINIO_BUCKET'] ??= 'docuvate';
process.env['WORKER_URL'] ??= 'http://127.0.0.1:8000';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const outPath = join(root, 'openapi/docuvate.v1.json');

async function main(): Promise<void> {
  const { AppModule } = await import('../dist/app.module.js');
  const { applyOpenApiGenerationOverrides } = await import('../dist/openapi/openapi-generation-overrides.js');
  const { buildOpenApiDocument } = await import('../dist/openapi/build-openapi-document.js');

  let builder = Test.createTestingModule({ imports: [AppModule] });
  builder = applyOpenApiGenerationOverrides(builder);
  const moduleFixture = await builder.compile();

  const app = moduleFixture.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter({ logger: false })
  );
  await app.init();

  const document = buildOpenApiDocument(app);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(document, null, 2)}\n`);

  const pathCount = Object.keys(document.paths ?? {}).length;
  console.log(`Wrote ${outPath} (${pathCount} paths)`);
  await app.close();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
