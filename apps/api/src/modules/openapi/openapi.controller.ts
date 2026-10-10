// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Controller, Get } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface.js';

import { OpenapiDocumentService } from '../../openapi/openapi-document.service.js';
import { Public } from '../../shared/infrastructure/auth/public.decorator.js';
import { ApiDocuvateTaggedController } from '../../shared/presentation/swagger/openapi-decorators.js';

@ApiDocuvateTaggedController('meta')
@Controller('openapi.json')
export class OpenapiController {
  constructor(private readonly openApi: OpenapiDocumentService) {}

  @Public()
  @Get()
  @ApiOperation({
    operationId: 'getOpenApiDocument',
    summary: 'Download OpenAPI 3.1 specification',
    description: 'JSON document describing all `/v1` operations, schemas, and security schemes.',
  })
  getSpec(): OpenAPIObject {
    return this.openApi.getDocument();
  }
}
