import { Controller, Get } from '@nestjs/common';
import { Public } from '../../shared/infrastructure/auth/public.decorator.js';
import { ApiOperation } from '@nestjs/swagger';
import { OpenapiDocumentService } from '../../openapi/openapi-document.service.js';
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
  getSpec(): Record<string, unknown> {
    return this.openApi.getDocument() as unknown as Record<string, unknown>;
  }
}
