// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { OpenAPIObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface.js';
import { isPublicOpenApiExcludedPath } from './public-openapi-paths.js';

/** Strip non-product routes before writing openapi/docuvate.v1.json or serving /v1/openapi.json. */
export function applyPublicOpenApiFilter(document: OpenAPIObject): OpenAPIObject {
  const paths = { ...(document.paths ?? {}) };
  for (const path of Object.keys(paths)) {
    if (isPublicOpenApiExcludedPath(path)) {
      delete paths[path];
    }
  }

  const usedTagNames = new Set<string>();
  for (const pathItem of Object.values(paths)) {
    for (const operation of Object.values(pathItem ?? {})) {
      if (!operation || typeof operation !== 'object' || !('tags' in operation)) continue;
      for (const tag of operation.tags as string[]) {
        usedTagNames.add(tag);
      }
    }
  }

  const tags = (document.tags ?? []).filter((tag) => usedTagNames.has(tag.name));

  return { ...document, paths, tags };
}
