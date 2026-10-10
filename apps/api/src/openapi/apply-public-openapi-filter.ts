// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { OpenAPIObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface.js';

import { openApiPathItemOperations } from './openapi-type-guards.js';
import { isPublicOpenApiExcludedPath } from './public-openapi-paths.js';

/** Strip non-product routes before writing openapi/docuvate.v1.json or serving /v1/openapi.json. */
export function applyPublicOpenApiFilter(document: OpenAPIObject): OpenAPIObject {
  const filteredPaths: NonNullable<OpenAPIObject['paths']> = {};
  for (const [path, pathItem] of Object.entries(document.paths)) {
    if (isPublicOpenApiExcludedPath(path)) {
      continue;
    }
    filteredPaths[path] = pathItem;
  }

  const usedTagNames = new Set<string>();
  for (const pathItem of Object.values(filteredPaths)) {
    for (const operation of openApiPathItemOperations(pathItem)) {
      for (const tag of operation.tags ?? []) {
        usedTagNames.add(tag);
      }
    }
  }

  const tags = (document.tags ?? []).filter((tag) => usedTagNames.has(tag.name));

  return { ...document, paths: filteredPaths, tags };
}
