// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { applyDecorators } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import { ApiErrorEnvelopeDto } from '../dtos/common.dto.js';
import { ApiDocuvateAuth } from './openapi-security.js';

export function ApiDocuvateRoute(options: {
  operationId: string;
  summary: string;
  description?: string;
}): MethodDecorator {
  return applyDecorators(
    ApiOperation({
      operationId: options.operationId,
      summary: options.summary,
      description: options.description,
    }),
    ApiUnauthorizedResponse({ type: ApiErrorEnvelopeDto }),
    ApiForbiddenResponse({ type: ApiErrorEnvelopeDto }),
    ApiNotFoundResponse({ type: ApiErrorEnvelopeDto }),
    ApiUnprocessableEntityResponse({ type: ApiErrorEnvelopeDto })
  );
}

export function ApiDocuvateController(tag: string): ClassDecorator {
  return applyDecorators(ApiTags(tag), ApiDocuvateAuth());
}

/** Product controller tag without default security (use on routes that mix public and authenticated ops). */
export function ApiDocuvateTaggedController(tag: string): ClassDecorator {
  return applyDecorators(ApiTags(tag));
}

export function ApiDocuvatePublicRoute(options: {
  operationId: string;
  summary: string;
  description?: string;
}): MethodDecorator {
  return applyDecorators(
    ApiOperation({
      operationId: options.operationId,
      summary: options.summary,
      description: options.description,
    })
  );
}
