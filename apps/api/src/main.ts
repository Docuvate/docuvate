import { initOtel } from '@docuvate/otel';
initOtel({ serviceName: process.env['OTEL_SERVICE_NAME'] ?? 'docuvate-api' });

import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import multipart from '@fastify/multipart';
import type { FastifyRequest } from 'fastify';
import { API_VERSION_PREFIX } from './shared/presentation/api-version.js';
import { DomainExceptionFilter } from './shared/presentation/domain-exception.filter.js';
async function bootstrap(): Promise<void> {
  const { isOpenApiHeadlessMode } = await import('./shared/infrastructure/database/typeorm-options.js');
  if (isOpenApiHeadlessMode()) {
    console.error(
      'Refusing to start HTTP server: DOCUVATE_OPENAPI_HEADLESS=1 is only for scripts/export-openapi.mts'
    );
    process.exit(1);
  }

  const { AppModule } = await import('./app.module.js');
  const { auth } = await import('./shared/infrastructure/auth/better-auth.config.js');
  const { registerBetterAuthHttpRoutes } = await import(
    './shared/infrastructure/auth/register-better-auth-http-routes.js'
  );

  const adapter = new FastifyAdapter({ logger: true });
  const fastifyPre = adapter.getInstance();
  fastifyPre.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (req, body, done) => {
      (req as FastifyRequest & { rawBody?: Buffer }).rawBody = body as Buffer;
      try {
        const json = JSON.parse((body as Buffer).toString('utf8')) as unknown;
        done(null, json);
      } catch (err) {
        done(err as Error, undefined);
      }
    }
  );

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bodyParser: false,
  });

  await app.register(multipart, {
    limits: { fileSize: 25 * 1024 * 1024 },
  });

  const fastify = app.getHttpAdapter().getInstance();
  registerBetterAuthHttpRoutes(fastify, auth);

  app.setGlobalPrefix(API_VERSION_PREFIX, {
    exclude: [
      { path: 'health', method: RequestMethod.ALL },
      { path: 'health/ready', method: RequestMethod.ALL },
    ],
  });

  app.enableCors({
    origin: process.env['WEB_ORIGIN'] ?? 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  app.useGlobalFilters(new DomainExceptionFilter());

  await app.init();
  const { buildOpenApiDocument } = await import('./openapi/build-openapi-document.js');
  const { OpenapiDocumentService } = await import('./openapi/openapi-document.service.js');
  app.get(OpenapiDocumentService).setDocument(buildOpenApiDocument(app));

  const port = Number(process.env['PORT'] ?? 3001);
  await app.listen(port, '0.0.0.0');
}

bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
