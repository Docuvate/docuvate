// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  OperationObject,
  PathItemObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface.js';

import { isRecord } from '../shared/infrastructure/database/row-parse.js';

const OPENAPI_HTTP_METHODS = new Set([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
  'trace',
]);

export function isOpenApiOperationObject(value: unknown): value is OperationObject {
  return isRecord(value) && 'responses' in value;
}

export function openApiPathItemOperations(pathItem: PathItemObject): OperationObject[] {
  const operations: OperationObject[] = [];
  for (const [key, value] of Object.entries(pathItem)) {
    if (!OPENAPI_HTTP_METHODS.has(key)) {
      continue;
    }
    if (isOpenApiOperationObject(value)) {
      operations.push(value);
    }
  }
  return operations;
}

export function isOpenApiHttpMethodKey(key: string): boolean {
  return OPENAPI_HTTP_METHODS.has(key.toLowerCase());
}
