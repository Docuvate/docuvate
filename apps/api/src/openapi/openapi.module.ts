import { Global, Module } from '@nestjs/common';
import { OpenapiDocumentService } from './openapi-document.service.js';

@Global()
@Module({
  providers: [OpenapiDocumentService],
  exports: [OpenapiDocumentService],
})
export class OpenapiInfrastructureModule {}
