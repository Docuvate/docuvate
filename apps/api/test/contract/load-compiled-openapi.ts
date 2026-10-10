import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { OpenAPIObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface.js';
import type { TestingModuleBuilder } from '@nestjs/testing';

import { isRecord } from '../helpers/json.js';

type ApplyOverridesFn = (
  builder: TestingModuleBuilder
) => TestingModuleBuilder;

type BuildOpenApiFn = (app: NestFastifyApplication) => OpenAPIObject;

function isApplyOverridesFn(value: unknown): value is ApplyOverridesFn {
  return typeof value === 'function';
}

function isBuildOpenApiFn(value: unknown): value is BuildOpenApiFn {
  return typeof value === 'function';
}

export async function loadCompiledOpenApiHelpers(): Promise<{
  applyOpenApiGenerationOverrides: ApplyOverridesFn;
  buildOpenApiDocument: BuildOpenApiFn;
}> {
  const overridesMod: unknown = await import('../../dist/openapi/openapi-generation-overrides.js');
  const buildMod: unknown = await import('../../dist/openapi/build-openapi-document.js');

  if (!isRecord(overridesMod) || !isApplyOverridesFn(overridesMod.applyOpenApiGenerationOverrides)) {
    throw new Error('dist/openapi-generation-overrides.js missing applyOpenApiGenerationOverrides');
  }
  if (!isRecord(buildMod) || !isBuildOpenApiFn(buildMod.buildOpenApiDocument)) {
    throw new Error('dist/build-openapi-document.js missing buildOpenApiDocument');
  }

  return {
    applyOpenApiGenerationOverrides: overridesMod.applyOpenApiGenerationOverrides,
    buildOpenApiDocument: buildMod.buildOpenApiDocument,
  };
}
