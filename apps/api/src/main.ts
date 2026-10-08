import { initOtel } from '@docuvate/otel';
initOtel({ serviceName: process.env['OTEL_SERVICE_NAME'] ?? 'docuvate-api' });

import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import multipart from '@fastify/multipart';
import type { FastifyReply, FastifyRequest } from 'fastify';
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
  fastify.all('/api/auth/*', async (request: FastifyRequest & { rawBody?: Buffer }, reply: FastifyReply) => {
    const host = request.headers.host ?? 'localhost:3001';
    const url = new URL(request.raw.url ?? request.url, `http://${host}`);
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v);
      } else {
        headers.set(key, value);
      }
    }

    const init: RequestInit = {
      method: request.method,
      headers,
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (request.rawBody) {
        init.body = new Uint8Array(request.rawBody);
      } else if (request.body != null) {
        init.body = JSON.stringify(request.body);
      }
    }

    const response = await auth.handler(new Request(url, init));
    reply.status(response.status);
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'transfer-encoding') return;
      reply.header(key, value);
    });
    const buf = Buffer.from(await response.arrayBuffer());
    return reply.send(buf);
  });

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
