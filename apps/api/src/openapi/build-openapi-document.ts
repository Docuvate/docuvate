// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type {
  OpenAPIObject,
  OperationObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface.js';

import { API_VERSION_PREFIX } from '../shared/presentation/api-version.js';
import { ApiErrorEnvelopeDto } from '../shared/presentation/dtos/common.dto.js';
import { applyPublicOpenApiFilter } from './apply-public-openapi-filter.js';
import { openApiPathItemOperations } from './openapi-type-guards.js';

const STANDARD_ERROR_RESPONSES = {
  '401': {
    description: 'Unauthenticated (missing or invalid session / API key)',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiErrorEnvelopeDto' },
      },
    },
  },
  '403': {
    description: 'ABAC denied or insufficient service claims',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiErrorEnvelopeDto' },
      },
    },
  },
  '404': {
    description: 'Resource not found',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiErrorEnvelopeDto' },
      },
    },
  },
  '422': {
    description: 'Request validation failed',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiErrorEnvelopeDto' },
      },
    },
  },
} as const;

const OPENAPI_TAG_CATALOG = [
  {
    key: 'documents',
    name: 'Documents',
    description:
      'Document lifecycle: upload, search, metadata, file content, chat threads, duplicates, and extraction workflows.',
  },
  {
    key: 'taxonomy',
    name: 'Labels',
    description:
      'Tags (labels), recommendations, mapping, patterns, blocklist, and per-tag custom fields.',
  },
  {
    key: 'correspondents',
    name: 'Correspondents',
    description: 'Senders and partners for document assignment, with optional matching rules.',
  },
  {
    key: 'organizer',
    name: 'Organizer',
    description: 'Folders, saved views, and workspace organization helpers.',
  },
  {
    key: 'settings',
    name: 'Settings',
    description:
      'User preferences, document-chat provider selection, and extraction engine options.',
  },
  {
    key: 'connectors',
    name: 'Connectors',
    description: 'External storage connectors: browse, import, and export documents.',
  },
  {
    key: 'ml',
    name: 'Models',
    description: 'Model registry, training jobs, and extraction feedback.',
  },
  {
    key: 'meta',
    name: 'API metadata',
    description: 'Machine-readable OpenAPI description of this API.',
  },
] as const;

function humanizeOperationId(operationId: string): string {
  const spaced = operationId.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function needsSummaryPolish(summary: string, operationId: string | undefined): boolean {
  if (operationId && summary === operationId) return true;
  if (/^[a-z]+$/.test(summary)) return true;
  if (/^[a-z][a-zA-Z0-9]*$/.test(summary) && /[A-Z]/.test(summary)) return true;
  return false;
}

function resolveCatalogTagName(tag: string): string {
  for (const entry of OPENAPI_TAG_CATALOG) {
    if (entry.key === tag) {
      return entry.name;
    }
  }
  return tag;
}

function applyOpenApiTagCatalog(document: OpenAPIObject): void {
  const usedNames = new Set<string>();

  for (const pathItem of Object.values(document.paths)) {
    for (const operation of openApiPathItemOperations(pathItem)) {
      const tags = operation.tags ?? [];
      operation.tags = tags.map((tag) => {
        const name = resolveCatalogTagName(tag);
        usedNames.add(name);
        return name;
      });
    }
  }

  document.tags = OPENAPI_TAG_CATALOG.filter((entry) => usedNames.has(entry.name)).map(
    ({ name, description }) => ({ name, description })
  );
}

function polishOperationSummaries(document: OpenAPIObject): void {
  for (const pathItem of Object.values(document.paths)) {
    for (const operation of openApiPathItemOperations(pathItem)) {
      if (!operation.summary) continue;
      if (needsSummaryPolish(operation.summary, operation.operationId)) {
        operation.summary = humanizeOperationId(operation.operationId ?? operation.summary);
      }
    }
  }
}

function mergeStandardErrorResponses(operation: OperationObject): void {
  const responses = operation.responses;
  for (const [code, response] of Object.entries(STANDARD_ERROR_RESPONSES)) {
    responses[code] ??= response;
  }
}

export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  let configBuilder = new DocumentBuilder()
    .setTitle('Docuvate Product API')
    .setDescription(
      'Headless document data-room API (`/v1`). Service integrators use API keys (`Authorization: Bearer` or `X-Docuvate-Api-Key`). ABAC applies on document read/list/content/chat.'
    )
    .setVersion('1.0.0')
    .addServer(`/${API_VERSION_PREFIX}`, 'Versioned product API');

  for (const tag of OPENAPI_TAG_CATALOG) {
    configBuilder = configBuilder.addTag(tag.name, tag.description);
  }

  const config = configBuilder
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', description: 'Service API key as Bearer token' },
      'bearerAuth'
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-Docuvate-Api-Key',
        in: 'header',
        description: 'Service API key (alternative to Bearer)',
      },
      'apiKeyAuth'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [ApiErrorEnvelopeDto],
  });

  document.openapi = '3.1.0';

  for (const pathItem of Object.values(document.paths)) {
    for (const operation of openApiPathItemOperations(pathItem)) {
      mergeStandardErrorResponses(operation);
    }
  }

  applyOpenApiTagCatalog(document);
  polishOperationSummaries(document);

  return sortOpenApiDocument(applyPublicOpenApiFilter(document));
}

/** Stable key order so `openapi:export` / `sdk:check` diffs are deterministic. */
function sortOpenApiDocument(document: OpenAPIObject): OpenAPIObject {
  const paths = document.paths;
  const sortedPaths = Object.fromEntries(
    Object.keys(paths)
      .sort()
      .map((key) => [key, paths[key]])
  );

  const components = document.components;
  if (!components) {
    return { ...document, paths: sortedPaths };
  }

  const sortedComponents: NonNullable<OpenAPIObject['components']> = { ...components };
  const schemas = components.schemas;
  if (schemas) {
    sortedComponents.schemas = Object.fromEntries(
      Object.keys(schemas)
        .sort()
        .map((key) => [key, schemas[key]])
    );
  }

  return { ...document, paths: sortedPaths, components: sortedComponents };
}
